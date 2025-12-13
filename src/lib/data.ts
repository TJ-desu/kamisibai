import fs from 'fs';
import path from 'path';
import { Video, User } from '@/types';

const dataFilePath = path.join(process.cwd(), 'src/data/videos.json');
const usersFilePath = path.join(process.cwd(), 'src/data/users.json');

export function getVideos(): Video[] {
    if (!fs.existsSync(dataFilePath)) {
        return [];
    }
    const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
    try {
        return JSON.parse(fileContent);
    } catch (e) {
        return [];
    }
}

export function saveVideos(videos: Video[]) {
    fs.writeFileSync(dataFilePath, JSON.stringify(videos, null, 2), 'utf-8');
}

export function getUsers(): User[] {
    if (!fs.existsSync(usersFilePath)) {
        return [];
    }
    const fileContent = fs.readFileSync(usersFilePath, 'utf-8');
    try {
        return JSON.parse(fileContent);
    } catch (e) {
        return [];
    }
}

export function saveUsers(users: User[]) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
}
