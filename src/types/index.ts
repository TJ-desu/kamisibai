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
    url: string;
    thumbnail?: string;
    // Phase 2 fields
    viewCount: number;
    uploaderId: string;
    summary: string; // Max 140 chars
}
