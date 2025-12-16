import { NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Removed runtime = 'edge'

// Force dynamic because we read/write DB
export const dynamic = 'force-dynamic';

// GET: List all users (Admin only)
export async function GET(request: Request) {
    const token = (await cookies()).get('auth_token');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const authData = JSON.parse(token.value);
    if (authData.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany();
        // Don't return passwords
        const safeUsers = users.map(({ password, ...u }) => u);
        return NextResponse.json(safeUsers);
    } catch (e) {
        return NextResponse.json([], { status: 500 });
    }
}

// POST: Create a new user (Admin only)
export async function POST(request: Request) {
    const token = (await cookies()).get('auth_token');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const authData = JSON.parse(token.value);
    if (authData.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const { username, password } = await request.json();

        // Check exists
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 });
        }

        const newUser = await prisma.user.create({
            data: {
                username,
                password, // Storing plain text as requested (prototype)
                role: 'editor'
            }
        });

        return NextResponse.json({ success: true, user: { id: newUser.id, username, role: 'editor' } });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
