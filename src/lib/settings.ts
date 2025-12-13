
import { Settings } from '@/types'; // Re-using types or defining them here if not in @/types. The file had interface definition.
// The previous file defined interfaces inline. I should preserve them or import.
// Let's preserve them to avoid breaking imports elsewhere.

import defaultSettings from '@/data/settings.json';

export interface AwsSettings {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName: string;
}

export interface Settings {
    aws: AwsSettings;
}

// In-memory cache
let settingsCache: Settings = defaultSettings as Settings;

export function getSettings(): Settings {
    return settingsCache;
}

export function saveSettings(settings: Settings) {
    settingsCache = settings;
    console.warn('Persistence warning: saveSettings is in-memory only on Edge Runtime.');
}
