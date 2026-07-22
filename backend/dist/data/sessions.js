import { v4 as uuidv4 } from 'uuid';
const sessions = [];
export function createSession(input) {
    const now = new Date().toISOString();
    const session = {
        id: uuidv4(),
        createdAt: now,
        ...input
    };
    sessions.push(session);
    return session;
}
export function revokeSession(token) {
    const index = sessions.findIndex((session) => session.token === token);
    if (index >= 0) {
        sessions.splice(index, 1);
    }
}
