import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  anonymousName: string;
  avatarId: string;
  createdAt: Timestamp;
  isVolunteer?: boolean;
}

export interface SupportCircle {
  id: string;
  title: string;
  description: string;
  tags: string[];
  isActive: boolean;
  participantCount: number;
  createdAt: Timestamp;
  moderatorId?: string;
}

export interface CircleMember {
  userId: string;
  joinedAt: Timestamp;
  isSpeaking?: boolean;
}

export interface VoiceSession {
  id: string;
  participants: string[];
  status: 'pending' | 'active' | 'ended';
  createdAt: Timestamp;
  lastUpdateTime?: Timestamp;
}

export interface AppEvent {
  id: string;
  senderId: string;
  type: 'signal' | 'message' | 'join' | 'leave';
  payload: string;
  createdAt: Timestamp;
}
