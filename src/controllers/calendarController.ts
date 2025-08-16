import { Request, Response, NextFunction } from 'express';
import { CalendarService, CreateMeetingData, UpdateMeetingData, CalendarFilters } from '../services/calendarService';
import { AppError } from '../utils/AppError';

/**
 * Create a new meeting
 */
export const createMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const meetingData: CreateMeetingData = {
      title: req.body.title,
      description: req.body.description,
      startTime: new Date(req.body.startTime),
      endTime: new Date(req.body.endTime),
      timezone: req.body.timezone || 'UTC',
      location: req.body.location,
      meetingLink: req.body.meetingLink,
      meetingType: req.body.meetingType || 'group',
      maxParticipants: req.body.maxParticipants,
      isRecurring: req.body.isRecurring || false,
      recurrenceType: req.body.recurrenceType,
      recurrenceEndDate: req.body.recurrenceEndDate ? new Date(req.body.recurrenceEndDate) : undefined,
      participants: req.body.participants,
      // Agora-specific fields
      generateAgoraChannel: req.body.generateAgoraChannel,
      customAgoraChannelName: req.body.customAgoraChannelName,
      generatePassword: req.body.generatePassword,
      customPassword: req.body.customPassword,
      allowGuestAccess: req.body.allowGuestAccess ?? true,
    };

    const meeting = await CalendarService.createMeeting(userId, meetingData);

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: { meeting },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate meeting access and get join information
 */
export const validateMeetingAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      throw new AppError('Invalid meeting ID', 400);
    }

    const { password } = req.body;
    const userId = req.user?.id; // Optional for guest access

    const accessResult = await CalendarService.validateMeetingAccess(
      meetingId,
      password,
      userId
    );

    if (!accessResult.canJoin) {
      res.status(403).json({
        success: false,
        error: {
          message: accessResult.error,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        canJoin: true,
        joinInfo: accessResult.joinInfo,
        meeting: {
          id: accessResult.meeting?.id,
          title: accessResult.meeting?.title,
          startTime: accessResult.meeting?.startTime,
          endTime: accessResult.meeting?.endTime,
          status: accessResult.meeting?.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get meeting share link
 */
export const getMeetingShareLink = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      throw new AppError('Invalid meeting ID', 400);
    }

    const includePassword = req.query.includePassword === 'true';

    const shareData = await CalendarService.getMeetingShareLink(
      meetingId,
      userId,
      includePassword
    );

    res.status(200).json({
      success: true,
      data: shareData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate meeting invitation
 */
export const generateMeetingInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      throw new AppError('Invalid meeting ID', 400);
    }

    const invitation = await CalendarService.generateMeetingInvitation(
      meetingId,
      userId
    );

    res.status(200).json({
      success: true,
      data: { invitation },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update meeting password
 */
export const updateMeetingPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      throw new AppError('Invalid meeting ID', 400);
    }

    const { newPassword, removePassword } = req.body;

    const meeting = await CalendarService.updateMeetingPassword(
      meetingId,
      userId,
      newPassword,
      removePassword
    );

    res.status(200).json({
      success: true,
      message: removePassword ? 'Password removed successfully' : 'Password updated successfully',
      data: {
        meetingId: meeting.id,
        isPasswordProtected: meeting.isPasswordProtected,
        password: meeting.meetingPassword, // Only return for organizer
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join meeting (public endpoint for guests)
 */
export const joinMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      throw new AppError('Invalid meeting ID', 400);
    }

    const { password, guestName } = req.body;
    const userId = req.user?.id; // Optional for authenticated users

    const accessResult = await CalendarService.validateMeetingAccess(
      meetingId,
      password,
      userId
    );

    if (!accessResult.canJoin) {
      res.status(403).json({
        success: false,
        error: {
          message: accessResult.error,
        },
      });
      return;
    }

    // For guest users, we might want to log their participation
    if (!userId && guestName && accessResult.meeting?.allowGuestAccess) {
      // Could log guest participation here
      console.log(`Guest ${guestName} joined meeting ${meetingId}`);
    }

    res.status(200).json({
      success: true,
      message: 'Access granted to meeting',
      data: {
        joinInfo: accessResult.joinInfo,
        meeting: {
          id: accessResult.meeting?.id,
          title: accessResult.meeting?.title,
          startTime: accessResult.meeting?.startTime,
          endTime: accessResult.meeting?.endTime,
          agoraChannelName: accessResult.meeting?.agoraChannelName,
          agoraAppId: accessResult.meeting?.agoraAppId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get meetings for a user
 */
export const getMeetings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const filters: CalendarFilters = {};

    // Parse query parameters
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    if (req.query.meetingType) {
      filters.meetingType = req.query.meetingType as string;
    }
    if (req.query.organizerId) {
      filters.organizerId = parseInt(req.query.organizerId as string);
    }
    if (req.query.participantId) {
      filters.participantId = parseInt(req.query.participantId as string);
    }

    const meetings = await CalendarService.getMeetings(userId, filters);

    res.status(200).json({
      success: true,
      data: {
        meetings,
        count: meetings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get meeting details
 */
export const getMeetingDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      throw new AppError('Invalid meeting ID', 400);
    }

    const details = await CalendarService.getMeetingDetails(meetingId, userId);

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a meeting
 */
export const updateMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      throw new AppError('Invalid meeting ID', 400);
    }

    const updateData: UpdateMeetingData = {};

    // Only include provided fields
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.startTime !== undefined) updateData.startTime = new Date(req.body.startTime);
    if (req.body.endTime !== undefined) updateData.endTime = new Date(req.body.endTime);
    if (req.body.timezone !== undefined) updateData.timezone = req.body.timezone;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.meetingLink !== undefined) updateData.meetingLink = req.body.meetingLink;
    if (req.body.meetingType !== undefined) updateData.meetingType = req.body.meetingType;
    if (req.body.maxParticipants !== undefined) updateData.maxParticipants = req.body.maxParticipants;

    const meeting = await CalendarService.updateMeeting(meetingId, userId, updateData);

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: { meeting },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a meeting
 */
export const cancelMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      throw new AppError('Invalid meeting ID', 400);
    }

    await CalendarService.cancelMeeting(meetingId, userId);

    res.status(200).json({
      success: true,
      message: 'Meeting cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available time slots
 */
export const getAvailableTimeSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const date = new Date(req.query.date as string);
    const duration = req.query.duration ? parseInt(req.query.duration as string) : 60;
    const workingHours = {
      start: req.query.startHour ? parseInt(req.query.startHour as string) : 9,
      end: req.query.endHour ? parseInt(req.query.endHour as string) : 17,
    };

    if (isNaN(date.getTime())) {
      throw new AppError('Invalid date format', 400);
    }

    const timeSlots = await CalendarService.getAvailableTimeSlots(
      userId,
      date,
      duration,
      workingHours
    );

    res.status(200).json({
      success: true,
      data: {
        date: date.toISOString().split('T')[0],
        duration,
        workingHours,
        timeSlots,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add participants to a meeting
 */
export const addParticipants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      throw new AppError('Invalid meeting ID', 400);
    }

    const { participants } = req.body;
    if (!participants || !Array.isArray(participants)) {
      throw new AppError('Participants array is required', 400);
    }

    const addedParticipants = await CalendarService.addParticipants(meetingId, participants);

    res.status(200).json({
      success: true,
      message: 'Participants added successfully',
      data: { participants: addedParticipants },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update participant response
 */
export const updateParticipantResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      throw new AppError('Invalid meeting ID', 400);
    }

    const { status, notes } = req.body;
    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const participant = await CalendarService.updateParticipantResponse(
      meetingId,
      userId,
      status,
      notes
    );

    res.status(200).json({
      success: true,
      message: 'Response updated successfully',
      data: { participant },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upcoming meetings
 */
export const getUpcomingMeetings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const now = new Date();
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const meetings = await CalendarService.getMeetings(userId, {
      startDate: now,
      endDate: endOfWeek,
      status: 'scheduled',
    });

    res.status(200).json({
      success: true,
      data: {
        meetings: meetings.slice(0, limit),
        count: meetings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get calendar overview for a month
 */
export const getCalendarOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const meetings = await CalendarService.getMeetings(userId, {
      startDate,
      endDate,
    });

    // Group meetings by date
    const meetingsByDate: { [key: string]: any[] } = {};
    meetings.forEach(meeting => {
      const dateKey = meeting.startTime.toISOString().split('T')[0];
      if (!meetingsByDate[dateKey]) {
        meetingsByDate[dateKey] = [];
      }
      meetingsByDate[dateKey].push({
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        status: meeting.status,
        meetingType: meeting.meetingType,
      });
    });

    res.status(200).json({
      success: true,
      data: {
        year,
        month,
        totalMeetings: meetings.length,
        meetingsByDate,
      },
    });
  } catch (error) {
    next(error);
  }
};