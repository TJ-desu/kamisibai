
import { NextResponse } from 'next/server';
import { getUsers, saveUsers } from '@/lib/data';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// GET: List all users (Admin only)
export async function GET(request: Request) {
    const token = (await cookies()).get('auth_token');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const authData = JSON.parse(token.value);
    if (authData.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const users = getUsers();
    // Don't return passwords
    const safeUsers = users.map(({ password, ...u }) => u);
    return NextResponse.json(safeUsers);
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
        const users = getUsers();

        if (users.find(u => u.username === username)) {
            return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 });
        }

        const newUser = {
            id: uuidv4(),
            username,
            password, // Storing plain text as requested (prototype)
            role: 'editor' as const
        };

        users.push(newUser);
        saveUsers(users);

        return NextResponse.json({ success: true, user: { id: newUser.id, username, role: 'editor' } });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
