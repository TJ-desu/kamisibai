
import { Video, User } from '@/types';
import videosData from '../data/videos.json';
import usersData from '../data/users.json';
import { getJSON, putJSON } from './s3';

// In-memory cache to allow temporary changes during runtime
let videosCache: Video[] | null = null;
let usersCache: User[] | null = null;

const VIDEOS_KEY = 'data/videos.json';
const USERS_KEY = 'data/users.json';

export async function getVideos(): Promise<Video[]> {
    if (videosCache) return videosCache;

    try {
        const s3Data = await getJSON<Video[]>(VIDEOS_KEY);
        if (s3Data) {
            videosCache = s3Data;
            return s3Data;
        }
    } catch (e) {
        console.warn('Error fetching videos from S3, falling back to default', e);
    }

    // Fallback to default entries if S3 is empty or fails
    videosCache = [...(videosData as Video[])];
    return videosCache;
}

export async function saveVideos(videos: Video[]) {
    videosCache = videos;
    try {
        await putJSON(VIDEOS_KEY, videos);
    } catch (e) {
        console.error('Failed to save videos to S3', e);
    }
}

export async function getUsers(): Promise<User[]> {
    if (usersCache) return usersCache;

    try {
        const s3Data = await getJSON<User[]>(USERS_KEY);
        if (s3Data) {
            usersCache = s3Data;
            return s3Data;
        }
    } catch (e) {
        console.warn('Error fetching users from S3, falling back to default', e);
    }

    usersCache = [...(usersData as User[])];
    return usersCache;
}

export async function saveUsers(users: User[]) {
    usersCache = users;
    try {
        await putJSON(USERS_KEY, users);
    } catch (e) {
        console.error('Failed to save users to S3', e);
    }
}
