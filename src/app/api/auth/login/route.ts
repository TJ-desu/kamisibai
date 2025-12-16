import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/data';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        const users = await getUsers();

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            // In a real app, use a secure signed JWT. For this prototype, a simple JSON string is used.
            // We store user info in the cookie to identify role in middleware/pages.
            const authData = JSON.stringify({ id: user.id, username: user.username, role: user.role });

            // Expire in 1 day
            const oneDay = 24 * 60 * 60 * 1000;

            (await cookies()).set('auth_token', authData, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: oneDay,
                path: '/'
            });

            return NextResponse.json({ success: true, role: user.role });
        }

        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
