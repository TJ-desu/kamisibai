export type Role = 'admin' | 'editor';

export interface User {
    id: string;
    username: string;
    password: string; // Plaintext for this prototype as per requirements
    role: Role;
}

export interface Video {
    id: string;
    title: string;
    description: string;
    tags: string[];
    thumbnail?: string;
    uploaderId?: string; // ID of the user who uploaded the video
    viewCount?: number;
    updatedAt?: string;
    summary: string; // Max 140 chars
}
