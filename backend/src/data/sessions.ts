import { v4 as uuidv4 } from 'uuid';

export type SessionRecord = {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  createdAt: string;
  expiresAt: string;
};

const sessions: SessionRecord[] = [];

export function createSession(input: Omit<SessionRecord, 'id' | 'createdAt'>) {
  const now = new Date().toISOString();
  const session: SessionRecord = {
    id: uuidv4(),
    createdAt: now,
    ...input
  };
  sessions.push(session);
  return session;
}

export function revokeSession(token: string) {
  const index = sessions.findIndex((session) => session.token === token);
  if (index >= 0) {
    sessions.splice(index, 1);
  }
}
