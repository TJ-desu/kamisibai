
import fs from 'fs';
import path from 'path';

const settingsFilePath = path.join(process.cwd(), 'src/data/settings.json');

export interface AwsSettings {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName: string;
}

export interface Settings {
    aws: AwsSettings;
}

export function getSettings(): Settings {
    if (!fs.existsSync(settingsFilePath)) {
        return { aws: { accessKeyId: '', secretAccessKey: '', region: '', bucketName: '' } };
    }
    try {
        const content = fs.readFileSync(settingsFilePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return { aws: { accessKeyId: '', secretAccessKey: '', region: '', bucketName: '' } };
    }
}

export function saveSettings(settings: Settings) {
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf-8');
}
