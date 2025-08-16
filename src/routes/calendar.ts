import { Router } from 'express';
import {
  createMeeting,
  getMeetings,
  getMeetingDetails,
  updateMeeting,
  cancelMeeting,
  getAvailableTimeSlots,
  addParticipants,
  updateParticipantResponse,
  getUpcomingMeetings,
  getCalendarOverview,
  validateMeetingAccess,
  getMeetingShareLink,
  generateMeetingInvitation,
  updateMeetingPassword,
  joinMeeting,
} from '../controllers/calendarController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import {
  createMeetingSchema,
  updateMeetingSchema,
  addParticipantsSchema,
  participantResponseSchema,
  calendarFiltersSchema,
  availableTimeSlotsSchema,
  calendarOverviewSchema,
  upcomingMeetingsSchema,
} from '../utils/calendarValidation';

const router = Router();

// All calendar routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/calendar/meetings
 * @desc    Create a new meeting
 * @access  Private
 */
router.post('/meetings', validate(createMeetingSchema), createMeeting);

/**
 * @route   GET /api/calendar/meetings
 * @desc    Get meetings with optional filters
 * @access  Private
 */
router.get('/meetings', getMeetings);

/**
 * @route   GET /api/calendar/meetings/upcoming
 * @desc    Get upcoming meetings
 * @access  Private
 */
router.get('/meetings/upcoming', getUpcomingMeetings);

/**
 * @route   GET /api/calendar/meetings/:id
 * @desc    Get meeting details
 * @access  Private
 */
router.get('/meetings/:id', getMeetingDetails);

/**
 * @route   PUT /api/calendar/meetings/:id
 * @desc    Update a meeting
 * @access  Private (Organizer only)
 */
router.put('/meetings/:id', validate(updateMeetingSchema), updateMeeting);

/**
 * @route   DELETE /api/calendar/meetings/:id
 * @desc    Cancel a meeting
 * @access  Private (Organizer only)
 */
router.delete('/meetings/:id', cancelMeeting);

/**
 * @route   POST /api/calendar/meetings/:id/participants
 * @desc    Add participants to a meeting
 * @access  Private (Organizer only)
 */
router.post('/meetings/:id/participants', validate(addParticipantsSchema), addParticipants);

/**
 * @route   PUT /api/calendar/meetings/:id/response
 * @desc    Update participant response to meeting invitation
 * @access  Private
 */
router.put('/meetings/:id/response', validate(participantResponseSchema), updateParticipantResponse);

/**
 * @route   GET /api/calendar/availability
 * @desc    Get available time slots for a specific date
 * @access  Private
 */
router.get('/availability', getAvailableTimeSlots);

/**
 * @route   GET /api/calendar/overview
 * @desc    Get calendar overview for a month
 * @access  Private
 */
router.get('/overview', getCalendarOverview);

/**
 * @route   POST /api/calendar/meetings/:id/validate-access
 * @desc    Validate meeting access with password
 * @access  Public (for guest access)
 */
router.post('/meetings/:id/validate-access', validateMeetingAccess);

/**
 * @route   GET /api/calendar/meetings/:id/share-link
 * @desc    Get meeting share link
 * @access  Private
 */
router.get('/meetings/:id/share-link', getMeetingShareLink);

/**
 * @route   GET /api/calendar/meetings/:id/invitation
 * @desc    Generate meeting invitation
 * @access  Private (Organizer only)
 */
router.get('/meetings/:id/invitation', generateMeetingInvitation);

/**
 * @route   PUT /api/calendar/meetings/:id/password
 * @desc    Update meeting password
 * @access  Private (Organizer only)
 */
router.put('/meetings/:id/password', updateMeetingPassword);

/**
 * @route   POST /api/calendar/join/:id
 * @desc    Join meeting (public endpoint for guests)
 * @access  Public
 */
router.post('/join/:id', joinMeeting);

export default router;