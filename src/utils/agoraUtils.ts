import crypto from 'crypto';

/**
 * Generate a unique Agora channel name
 */
export function generateAgoraChannelName(meetingTitle: string, meetingId?: number): string {
  // Create a base from meeting title (sanitized)
  const sanitizedTitle = meetingTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  
  // Add timestamp and random string for uniqueness
  const timestamp = Date.now().toString(36);
  const randomString = crypto.randomBytes(4).toString('hex');
  
  // Combine with meeting ID if available
  const idPart = meetingId ? `_${meetingId}` : '';
  
  return `${sanitizedTitle}_${timestamp}_${randomString}${idPart}`;
}

/**
 * Generate a secure meeting password
 */
export function generateMeetingPassword(length: number = 8): string {
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Generate a shareable meeting link
 */
export function generateMeetingShareLink(
  baseUrl: string,
  meetingId: number,
  includePassword: boolean = false,
  password?: string
): string {
  let shareLink = `${baseUrl}/join/${meetingId}`;
  
  if (includePassword && password) {
    // Encode password in URL (for convenience, but not recommended for production)
    shareLink += `?pwd=${encodeURIComponent(password)}`;
  }
  
  return shareLink;
}

/**
 * Validate Agora channel name format
 */
export function validateAgoraChannelName(channelName: string): boolean {
  // Agora channel name requirements:
  // - 1-64 characters
  // - Can contain letters, numbers, underscores, hyphens
  const channelNameRegex = /^[a-zA-Z0-9_-]{1,64}$/;
  return channelNameRegex.test(channelName);
}

/**
 * Validate meeting password strength
 */
export function validateMeetingPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 4) {
    errors.push('Password must be at least 4 characters long');
  }
  
  if (password.length > 50) {
    errors.push('Password cannot exceed 50 characters');
  }
  
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(password)) {
    errors.push('Password contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate meeting join token (for additional security)
 */
export function generateMeetingJoinToken(
  meetingId: number,
  userId: number,
  expiresIn: number = 3600 // 1 hour in seconds
): string {
  const payload = {
    meetingId,
    userId,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    iat: Math.floor(Date.now() / 1000),
  };
  
  // Simple token generation (in production, use proper JWT)
  const tokenData = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
    .update(tokenData)
    .digest('hex');
  
  return `${tokenData}.${signature}`;
}

/**
 * Verify meeting join token
 */
export function verifyMeetingJoinToken(token: string): {
  isValid: boolean;
  payload?: any;
  error?: string;
} {
  try {
    const [tokenData, signature] = token.split('.');
    
    if (!tokenData || !signature) {
      return { isValid: false, error: 'Invalid token format' };
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
      .update(tokenData)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return { isValid: false, error: 'Invalid token signature' };
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(tokenData, 'base64').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { isValid: false, error: 'Token expired' };
    }
    
    return { isValid: true, payload };
  } catch (error) {
    return { isValid: false, error: 'Token parsing failed' };
  }
}

/**
 * Generate meeting invitation data
 */
export function generateMeetingInvitation(meeting: {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  agoraChannelName?: string;
  meetingPassword?: string;
  isPasswordProtected: boolean;
}): {
  meetingId: number;
  title: string;
  startTime: string;
  endTime: string;
  joinLink: string;
  password?: string;
  instructions: string[];
} {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const joinLink = generateMeetingShareLink(
    baseUrl,
    meeting.id,
    false // Don't include password in URL for security
  );
  
  const instructions = [
    `1. Click the join link: ${joinLink}`,
    '2. Enter your name to join the meeting',
  ];
  
  if (meeting.isPasswordProtected && meeting.meetingPassword) {
    instructions.push(`3. Enter the meeting password: ${meeting.meetingPassword}`);
  }
  
  instructions.push('4. Allow camera and microphone access when prompted');
  instructions.push('5. Click "Join Meeting" to enter the video call');
  
  return {
    meetingId: meeting.id,
    title: meeting.title,
    startTime: meeting.startTime.toISOString(),
    endTime: meeting.endTime.toISOString(),
    joinLink,
    password: meeting.isPasswordProtected ? meeting.meetingPassword : undefined,
    instructions,
  };
}