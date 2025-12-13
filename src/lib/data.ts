
import { Video, User } from '@/types';
import videosData from '@/data/videos.json';
import usersData from '@/data/users.json';

// In-memory cache to allow temporary changes during runtime
let videosCache: Video[] = [...(videosData as Video[])];
let usersCache: User[] = [...(usersData as User[])];

export function getVideos(): Video[] {
    return videosCache;
}

export function saveVideos(videos: Video[]) {
    // In Edge environment, we cannot write to the filesystem.
    // For now, update the in-memory cache so it persists for the lifetime of the instance.
    videosCache = videos;
    console.warn('Persistence warning: saveVideos is in-memory only on Edge Runtime.');
}

export function getUsers(): User[] {
    return usersCache;
}

export function saveUsers(users: User[]) {
    usersCache = users;
    console.warn('Persistence warning: saveUsers is in-memory only on Edge Runtime.');
}
