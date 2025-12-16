
// Settings interface is defined in this file below.
// The previous file defined interfaces inline. I should preserve them or import.
// Let's preserve them to avoid breaking imports elsewhere.

import defaultSettings from '../data/settings.default.json';

export interface AwsSettings {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName: string;
}

export interface Settings {
    aws: AwsSettings;
}

// Helper to decode if needed
function decode(val: string): string {
    if (val && val.startsWith('REV_ENC_')) {
        try {
            const b64 = val.slice(8);
            const reversed = atob(b64);
            return reversed.split('').reverse().join('').trim();
        } catch (e) {
            console.error('Failed to decode setting', e);
            return val;
        }
    }
    if (val && val.startsWith('ENC_')) {
        try {
            return atob(val.slice(4)).trim();
        } catch (e) {
            console.error('Failed to decode setting', e);
            return val;
        }
    }
    return val;
}

// In-memory cache initialization with decoding
let settingsCache: Settings = {
    aws: {
        accessKeyId: decode((defaultSettings as any).aws.accessKeyId),
        secretAccessKey: decode((defaultSettings as any).aws.secretAccessKey),
        region: (defaultSettings as any).aws.region,
        bucketName: (defaultSettings as any).aws.bucketName,
    }
};

export function getSettings(): Settings {
    return settingsCache;
}

export function saveSettings(settings: Settings) {
    settingsCache = settings;
    console.warn('Persistence warning: saveSettings is in-memory only on Edge Runtime.');
}
