
import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settings';
import { cookies } from 'next/headers';

// GET: Retrieve settings (Masked for security)
export async function GET() {
    const token = (await cookies()).get('auth_token');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const authData = JSON.parse(token.value);
    if (authData.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const settings = getSettings();
    // Mask secret key
    const maskedSettings = {
        ...settings,
        aws: {
            ...settings.aws,
            secretAccessKey: settings.aws.secretAccessKey ? '******' : ''
        }
    };

    return NextResponse.json(maskedSettings);
}

// POST: Update settings
export async function POST(request: Request) {
    const token = (await cookies()).get('auth_token');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const authData = JSON.parse(token.value);
    if (authData.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const currentSettings = getSettings();

        // If secret key is '******', keep the old one
        let newSecret = body.aws.secretAccessKey;
        if (newSecret === '******') {
            newSecret = currentSettings.aws.secretAccessKey;
        }

        const newSettings = {
            aws: {
                accessKeyId: body.aws.accessKeyId,
                secretAccessKey: newSecret,
                region: body.aws.region,
                bucketName: body.aws.bucketName
            }
        };

        saveSettings(newSettings);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
