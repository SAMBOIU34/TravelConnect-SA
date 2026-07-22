import { v4 as uuidv4 } from 'uuid';
const users = [];
export function listUsers() {
    return users;
}
export function findUserByEmail(email) {
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}
export function createUser(input) {
    const now = new Date().toISOString();
    const user = {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        ...input
    };
    users.push(user);
    return user;
}
