import { Meeting, MeetingAttributes, MeetingCreationAttributes } from '../models/Meeting';
import { MeetingParticipant, ParticipantStatus, ParticipantRole } from '../models/MeetingParticipant';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';
import {
  generateAgoraChannelName,
  generateMeetingPassword,
  generateMeetingShareLink,
  generateMeetingInvitation,
  validateMeetingPassword,
} from '../utils/agoraUtils';

export interface CreateMeetingData extends Omit<MeetingCreationAttributes, 'organizerId'> {
  participants?: {
    userId?: number;
    email?: string;
    name?: string;
    role?: ParticipantRole;
  }[];
  // Agora-specific options
  generateAgoraChannel?: boolean;
  customAgoraChannelName?: string;
  generatePassword?: boolean;
  customPassword?: string;
}

export interface UpdateMeetingData {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  timezone?: string;
  location?: string;
  meetingLink?: string;
  meetingType?: string;
  maxParticipants?: number;
  // Agora-specific updates
  agoraChannelName?: string;
  meetingPassword?: string;
  isPasswordProtected?: boolean;
  allowGuestAccess?: boolean;
}

export interface CalendarFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  meetingType?: string;
  organizerId?: number;
  participantId?: number;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflictingMeetings?: Meeting[];
}

export class CalendarService {
  /**
   * Create a new meeting
   */
  static async createMeeting(
    organizerId: number,
    meetingData: CreateMeetingData
  ): Promise<Meeting> {
    const {
      participants,
      generateAgoraChannel,
      customAgoraChannelName,
      generatePassword,
      customPassword,
      ...meetingInfo
    } = meetingData;

    // Validate meeting times
    this.validateMeetingTimes(meetingInfo.startTime, meetingInfo.endTime);

    // Check for conflicts
    const conflicts = await this.checkTimeConflicts(
      organizerId,
      meetingInfo.startTime,
      meetingInfo.endTime
    );

    if (conflicts.length > 0) {
      throw new AppError(
        `Time conflict detected with existing meetings: ${conflicts.map(m => m.title).join(', ')}`,
        400
      );
    }

    // Handle Agora channel name
    let agoraChannelName: string | undefined;
    if (generateAgoraChannel || customAgoraChannelName) {
      if (customAgoraChannelName) {
        // Validate custom channel name
        if (customAgoraChannelName.length > 100) {
          throw new AppError('Agora channel name cannot exceed 100 characters', 400);
        }
        agoraChannelName = customAgoraChannelName;
      } else {
        // Generate unique channel name
        agoraChannelName = generateAgoraChannelName(meetingInfo.title);
      }
    }

    // Handle meeting password
    let meetingPassword: string | undefined;
    let isPasswordProtected = false;
    
    if (generatePassword || customPassword) {
      if (customPassword) {
        // Validate custom password
        const passwordValidation = validateMeetingPassword(customPassword);
        if (!passwordValidation.isValid) {
          throw new AppError(
            `Invalid password: ${passwordValidation.errors.join(', ')}`,
            400
          );
        }
        meetingPassword = customPassword;
      } else {
        // Generate secure password
        meetingPassword = generateMeetingPassword(8);
      }
      isPasswordProtected = true;
    }

    // Create the meeting with Agora fields
    const meeting = await Meeting.create({
      ...meetingInfo,
      organizerId,
      agoraChannelName,
      agoraAppId: process.env.AGORA_APP_ID,
      meetingPassword,
      isPasswordProtected,
      allowGuestAccess: meetingInfo.allowGuestAccess ?? true,
    });

    // Add organizer as participant
    await MeetingParticipant.create({
      meetingId: meeting.id,
      userId: organizerId,
      status: 'accepted',
      role: 'organizer',
      responseDate: new Date(),
    });

    // Add other participants if provided
    if (participants && participants.length > 0) {
      await this.addParticipants(meeting.id, participants);
    }

    return meeting;
  }

  /**
   * Update an existing meeting
   */
  static async updateMeeting(
    meetingId: number,
    userId: number,
    updateData: UpdateMeetingData
  ): Promise<Meeting> {
    const meeting = await Meeting.findByPk(meetingId);

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    // Check if user is the organizer
    if (meeting.organizerId !== userId) {
      throw new AppError('Only the organizer can update this meeting', 403);
    }

    // Check if meeting can be modified
    if (!meeting.canBeModified()) {
      throw new AppError('This meeting cannot be modified', 400);
    }

    // Validate new times if provided
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime || meeting.startTime;
      const endTime = updateData.endTime || meeting.endTime;
      
      this.validateMeetingTimes(startTime, endTime);

      // Check for conflicts (excluding current meeting)
      const conflicts = await this.checkTimeConflicts(
        userId,
        startTime,
        endTime,
        meetingId
      );

      if (conflicts.length > 0) {
        throw new AppError(
          `Time conflict detected with existing meetings: ${conflicts.map(m => m.title).join(', ')}`,
          400
        );
      }
    }

    // Update the meeting
    await meeting.update(updateData);
    return meeting;
  }

  /**
   * Cancel a meeting
   */
  static async cancelMeeting(meetingId: number, userId: number): Promise<void> {
    const meeting = await Meeting.findByPk(meetingId);

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    if (meeting.organizerId !== userId) {
      throw new AppError('Only the organizer can cancel this meeting', 403);
    }

    if (meeting.status === 'cancelled') {
      throw new AppError('Meeting is already cancelled', 400);
    }

    await meeting.update({ status: 'cancelled' });
  }

  /**
   * Get meetings for a specific date range
   */
  static async getMeetings(
    userId: number,
    filters: CalendarFilters = {}
  ): Promise<Meeting[]> {
    const whereClause: any = {};

    // Date range filter
    if (filters.startDate || filters.endDate) {
      whereClause.startTime = {};
      if (filters.startDate) {
        whereClause.startTime[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.startTime[Op.lte] = filters.endDate;
      }
    }

    // Status filter
    if (filters.status) {
      whereClause.status = filters.status;
    }

    // Meeting type filter
    if (filters.meetingType) {
      whereClause.meetingType = filters.meetingType;
    }

    // Organizer filter
    if (filters.organizerId) {
      whereClause.organizerId = filters.organizerId;
    }

    let meetings: Meeting[];

    if (filters.participantId) {
      // Get meetings where user is a participant
      const participantMeetings = await MeetingParticipant.findAll({
        where: { userId: filters.participantId },
        include: [{
          model: Meeting,
          where: whereClause,
          required: true,
        }]
      });
      meetings = participantMeetings.map(p => p.get('Meeting') as Meeting);
    } else {
      // Get meetings where user is organizer or participant
      const organizerMeetings = await Meeting.findAll({
        where: { ...whereClause, organizerId: userId }
      });

      const participantMeetings = await MeetingParticipant.findAll({
        where: { userId },
        include: [{
          model: Meeting,
          where: whereClause,
          required: true,
        }]
      });

      const participantMeetingsList = participantMeetings.map(p => p.get('Meeting') as Meeting);
      
      // Combine and deduplicate
      const allMeetings = [...organizerMeetings, ...participantMeetingsList];
      const uniqueMeetings = allMeetings.filter((meeting, index, self) =>
        index === self.findIndex(m => m.id === meeting.id)
      );

      meetings = uniqueMeetings;
    }

    return meetings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Get available time slots for scheduling
   */
  static async getAvailableTimeSlots(
    userId: number,
    date: Date,
    duration: number = 60, // minutes
    workingHours: { start: number; end: number } = { start: 9, end: 17 }
  ): Promise<TimeSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(workingHours.start, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(workingHours.end, 0, 0, 0);

    // Get existing meetings for the day
    const existingMeetings = await this.getMeetings(userId, {
      startDate: startOfDay,
      endDate: endOfDay,
    });

    const timeSlots: TimeSlot[] = [];
    const slotDuration = duration * 60 * 1000; // Convert to milliseconds

    let currentTime = new Date(startOfDay);

    while (currentTime.getTime() + slotDuration <= endOfDay.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration);
      
      const conflictingMeetings = existingMeetings.filter(meeting =>
        (currentTime < meeting.endTime && slotEnd > meeting.startTime)
      );

      timeSlots.push({
        start: new Date(currentTime),
        end: new Date(slotEnd),
        available: conflictingMeetings.length === 0,
        conflictingMeetings: conflictingMeetings.length > 0 ? conflictingMeetings : undefined,
      });

      currentTime = new Date(currentTime.getTime() + (30 * 60 * 1000)); // 30-minute intervals
    }

    return timeSlots;
  }

  /**
   * Add participants to a meeting
   */
  static async addParticipants(
    meetingId: number,
    participants: {
      userId?: number;
      email?: string;
      name?: string;
      role?: ParticipantRole;
    }[]
  ): Promise<MeetingParticipant[]> {
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    const createdParticipants: MeetingParticipant[] = [];

    for (const participant of participants) {
      // Check if participant already exists
      const existingParticipant = await MeetingParticipant.findOne({
        where: {
          meetingId,
          ...(participant.userId ? { userId: participant.userId } : { email: participant.email })
        }
      });

      if (!existingParticipant) {
        const newParticipant = await MeetingParticipant.create({
          meetingId,
          userId: participant.userId || 0, // Will be 0 for external participants
          email: participant.email,
          name: participant.name,
          role: participant.role || 'attendee',
          status: 'invited',
        });
        createdParticipants.push(newParticipant);
      }
    }

    return createdParticipants;
  }

  /**
   * Update participant response
   */
  static async updateParticipantResponse(
    meetingId: number,
    userId: number,
    status: ParticipantStatus,
    notes?: string
  ): Promise<MeetingParticipant> {
    const participant = await MeetingParticipant.findOne({
      where: { meetingId, userId }
    });

    if (!participant) {
      throw new AppError('Participant not found', 404);
    }

    await participant.update({
      status,
      responseDate: new Date(),
      notes,
    });

    return participant;
  }

  /**
   * Get meeting details with participants
   */
  static async getMeetingDetails(meetingId: number, userId: number): Promise<{
    meeting: Meeting;
    participants: MeetingParticipant[];
    userParticipation?: MeetingParticipant;
  }> {
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    const participants = await MeetingParticipant.findByMeeting(meetingId);
    const userParticipation = participants.find(p => p.userId === userId);

    // Check if user has access to this meeting
    const hasAccess = meeting.organizerId === userId || userParticipation;
    if (!hasAccess) {
      throw new AppError('Access denied', 403);
    }

    return {
      meeting,
      participants,
      userParticipation,
    };
  }

  /**
   * Validate meeting password and get join information
   */
  static async validateMeetingAccess(
    meetingId: number,
    password?: string,
    userId?: number
  ): Promise<{
    canJoin: boolean;
    meeting?: Meeting;
    joinInfo?: any;
    error?: string;
  }> {
    const meeting = await Meeting.findByPk(meetingId);
    
    if (!meeting) {
      return { canJoin: false, error: 'Meeting not found' };
    }

    if (meeting.status === 'cancelled') {
      return { canJoin: false, error: 'Meeting has been cancelled' };
    }

    if (meeting.status === 'completed') {
      return { canJoin: false, error: 'Meeting has already ended' };
    }

    // Check if user is a participant
    let isParticipant = false;
    if (userId) {
      const participation = await MeetingParticipant.findOne({
        where: { meetingId, userId }
      });
      isParticipant = !!participation;
    }

    // Check password requirement
    if (meeting.requiresPassword()) {
      if (!password) {
        return { canJoin: false, error: 'Meeting password is required' };
      }
      
      if (!meeting.validatePassword(password)) {
        return { canJoin: false, error: 'Invalid meeting password' };
      }
    }

    // Check guest access
    if (!isParticipant && !meeting.allowGuestAccess) {
      return { canJoin: false, error: 'Guest access is not allowed for this meeting' };
    }

    // Return join information
    return {
      canJoin: true,
      meeting,
      joinInfo: meeting.getJoinInfo(),
    };
  }

  /**
   * Generate meeting invitation with all necessary details
   */
  static async generateMeetingInvitation(
    meetingId: number,
    organizerId: number
  ): Promise<any> {
    const meeting = await Meeting.findByPk(meetingId);
    
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    if (meeting.organizerId !== organizerId) {
      throw new AppError('Only the organizer can generate invitations', 403);
    }

    return generateMeetingInvitation(meeting);
  }

  /**
   * Get meeting share link
   */
  static async getMeetingShareLink(
    meetingId: number,
    userId: number,
    includePassword: boolean = false
  ): Promise<{
    shareLink: string;
    meetingId: number;
    title: string;
    password?: string;
    requiresPassword: boolean;
  }> {
    const meeting = await Meeting.findByPk(meetingId);
    
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    // Check if user has access to generate share link
    const isOrganizer = meeting.organizerId === userId;
    const isParticipant = await MeetingParticipant.findOne({
      where: { meetingId, userId }
    });

    if (!isOrganizer && !isParticipant) {
      throw new AppError('Access denied', 403);
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareLink = generateMeetingShareLink(
      baseUrl,
      meetingId,
      includePassword,
      meeting.meetingPassword
    );

    return {
      shareLink,
      meetingId: meeting.id,
      title: meeting.title,
      password: includePassword ? meeting.meetingPassword : undefined,
      requiresPassword: meeting.requiresPassword(),
    };
  }

  /**
   * Update meeting password
   */
  static async updateMeetingPassword(
    meetingId: number,
    organizerId: number,
    newPassword?: string,
    removePassword: boolean = false
  ): Promise<Meeting> {
    const meeting = await Meeting.findByPk(meetingId);
    
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    if (meeting.organizerId !== organizerId) {
      throw new AppError('Only the organizer can update the meeting password', 403);
    }

    if (removePassword) {
      await meeting.update({
        meetingPassword: null,
        isPasswordProtected: false,
      });
    } else if (newPassword) {
      const passwordValidation = validateMeetingPassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(
          `Invalid password: ${passwordValidation.errors.join(', ')}`,
          400
        );
      }

      await meeting.update({
        meetingPassword: newPassword,
        isPasswordProtected: true,
      });
    } else {
      // Generate new password
      const generatedPassword = generateMeetingPassword(8);
      await meeting.update({
        meetingPassword: generatedPassword,
        isPasswordProtected: true,
      });
    }

    return meeting;
  }

  /**
   * Private helper methods
   */
  private static validateMeetingTimes(startTime: Date, endTime: Date): void {
    const now = new Date();
    
    if (startTime <= now) {
      throw new AppError('Start time must be in the future', 400);
    }

    if (endTime <= startTime) {
      throw new AppError('End time must be after start time', 400);
    }

    const duration = endTime.getTime() - startTime.getTime();
    const maxDuration = 8 * 60 * 60 * 1000; // 8 hours

    if (duration > maxDuration) {
      throw new AppError('Meeting duration cannot exceed 8 hours', 400);
    }
  }

  private static async checkTimeConflicts(
    userId: number,
    startTime: Date,
    endTime: Date,
    excludeMeetingId?: number
  ): Promise<Meeting[]> {
    const whereClause: any = {
      [Op.or]: [
        { organizerId: userId },
        {
          id: {
            [Op.in]: await MeetingParticipant.findAll({
              where: { userId, status: 'accepted' },
              attributes: ['meetingId']
            }).then(participants => participants.map(p => p.meetingId))
          }
        }
      ],
      status: { [Op.ne]: 'cancelled' },
      [Op.or]: [
        {
          startTime: { [Op.between]: [startTime, endTime] }
        },
        {
          endTime: { [Op.between]: [startTime, endTime] }
        },
        {
          [Op.and]: [
            { startTime: { [Op.lte]: startTime } },
            { endTime: { [Op.gte]: endTime } }
          ]
        }
      ]
    };

    if (excludeMeetingId) {
      whereClause.id = { [Op.ne]: excludeMeetingId };
    }

    return Meeting.findAll({ where: whereClause });
  }
}