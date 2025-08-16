import Joi from 'joi';

// Meeting creation schema
export const createMeetingSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'Meeting title is required',
    'string.min': 'Meeting title must be at least 3 characters long',
    'string.max': 'Meeting title cannot exceed 200 characters',
  }),
  description: Joi.string().max(1000).optional().allow(''),
  startTime: Joi.date().iso().greater('now').required().messages({
    'date.base': 'Start time must be a valid date',
    'date.greater': 'Start time must be in the future',
    'any.required': 'Start time is required',
  }),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required().messages({
    'date.base': 'End time must be a valid date',
    'date.greater': 'End time must be after start time',
    'any.required': 'End time is required',
  }),
  timezone: Joi.string().max(50).default('UTC'),
  location: Joi.string().max(255).optional().allow(''),
  meetingLink: Joi.string().uri().max(500).optional().allow(''),
  meetingType: Joi.string().valid('one_on_one', 'group', 'presentation', 'workshop', 'other').default('group'),
  maxParticipants: Joi.number().integer().min(1).max(1000).optional(),
  isRecurring: Joi.boolean().default(false),
  recurrenceType: Joi.string().valid('none', 'daily', 'weekly', 'monthly').when('isRecurring', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  recurrenceEndDate: Joi.date().iso().when('isRecurring', {
    is: true,
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  participants: Joi.array().items(
    Joi.object({
      userId: Joi.number().integer().optional(),
      email: Joi.string().email().optional(),
      name: Joi.string().max(100).optional(),
      role: Joi.string().valid('organizer', 'presenter', 'attendee', 'optional').default('attendee'),
    }).or('userId', 'email')
  ).optional(),
  // Agora-specific fields
  generateAgoraChannel: Joi.boolean().default(true),
  customAgoraChannelName: Joi.string().max(100).optional(),
  generatePassword: Joi.boolean().default(false),
  customPassword: Joi.string().min(4).max(50).optional(),
  allowGuestAccess: Joi.boolean().default(true),
});

// Meeting update schema
export const updateMeetingSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  startTime: Joi.date().iso().greater('now').optional(),
  endTime: Joi.date().iso().when('startTime', {
    is: Joi.exist(),
    then: Joi.date().iso().greater(Joi.ref('startTime')).required(),
    otherwise: Joi.date().iso().optional()
  }),
  timezone: Joi.string().max(50).optional(),
  location: Joi.string().max(255).optional().allow(''),
  meetingLink: Joi.string().uri().max(500).optional().allow(''),
  meetingType: Joi.string().valid('one_on_one', 'group', 'presentation', 'workshop', 'other').optional(),
  maxParticipants: Joi.number().integer().min(1).max(1000).optional(),
  // Agora-specific updates
  agoraChannelName: Joi.string().max(100).optional(),
  meetingPassword: Joi.string().min(4).max(50).optional(),
  isPasswordProtected: Joi.boolean().optional(),
  allowGuestAccess: Joi.boolean().optional(),
}).min(1);

// Add participants schema
export const addParticipantsSchema = Joi.object({
  participants: Joi.array().items(
    Joi.object({
      userId: Joi.number().integer().optional(),
      email: Joi.string().email().optional(),
      name: Joi.string().max(100).optional(),
      role: Joi.string().valid('organizer', 'presenter', 'attendee', 'optional').default('attendee'),
    }).or('userId', 'email')
  ).min(1).required(),
});

// Participant response schema
export const participantResponseSchema = Joi.object({
  status: Joi.string().valid('accepted', 'declined', 'tentative').required(),
  notes: Joi.string().max(500).optional().allow(''),
});

// Calendar filters schema
export const calendarFiltersSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().when('startDate', {
    is: Joi.exist(),
    then: Joi.date().iso().greater(Joi.ref('startDate')),
    otherwise: Joi.date().iso()
  }).optional(),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
  meetingType: Joi.string().valid('one_on_one', 'group', 'presentation', 'workshop', 'other').optional(),
  organizerId: Joi.number().integer().optional(),
  participantId: Joi.number().integer().optional(),
});

// Available time slots schema
export const availableTimeSlotsSchema = Joi.object({
  date: Joi.date().iso().required(),
  duration: Joi.number().integer().min(15).max(480).default(60), // 15 minutes to 8 hours
  startHour: Joi.number().integer().min(0).max(23).default(9),
  endHour: Joi.number().integer().min(1).max(24).default(17),
}).custom((value, helpers) => {
  if (value.startHour >= value.endHour) {
    return helpers.error('any.invalid', { message: 'Start hour must be before end hour' });
  }
  return value;
});

// Calendar overview schema
export const calendarOverviewSchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2030).default(new Date().getFullYear()),
  month: Joi.number().integer().min(1).max(12).default(new Date().getMonth() + 1),
});

// Upcoming meetings schema
export const upcomingMeetingsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// Meeting access validation schema
export const meetingAccessSchema = Joi.object({
  password: Joi.string().min(4).max(50).optional(),
  guestName: Joi.string().max(100).optional(),
});

// Meeting password update schema
export const meetingPasswordSchema = Joi.object({
  newPassword: Joi.string().min(4).max(50).optional(),
  removePassword: Joi.boolean().default(false),
}).custom((value, helpers) => {
  if (!value.newPassword && !value.removePassword) {
    return helpers.error('any.invalid', { message: 'Either newPassword or removePassword must be provided' });
  }
  if (value.newPassword && value.removePassword) {
    return helpers.error('any.invalid', { message: 'Cannot provide both newPassword and removePassword' });
  }
  return value;
});

// Join meeting schema
export const joinMeetingSchema = Joi.object({
  password: Joi.string().min(4).max(50).optional(),
  guestName: Joi.string().max(100).when('$isGuest', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
});