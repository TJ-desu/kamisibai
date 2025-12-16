
import { AwsClient } from './s3-signer';
import { getSettings } from './settings';

export async function uploadFileToS3(buffer: ArrayBuffer | Uint8Array, key: string, contentType: string): Promise<string> {
    const settings = getSettings();
    const { accessKeyId, secretAccessKey, region, bucketName } = settings.aws;

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
        throw new Error('AWS credentials are not configured in Admin Settings.');
        // Note: Filesystem settings are read-only defaults on Edge immediately after build.
        // User must configure them via UI or Env Vars if not in default json.
    }

    const client = new AwsClient({
        accessKeyId,
        secretAccessKey,
        region,
        service: 's3',
    });

    // Ensure key components are properly encoded for the URL (and Signature match)
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${encodedKey}`;

    const request = new Request(url, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            'Content-Length': buffer.byteLength.toString(),
        },
        body: buffer as unknown as BodyInit,
    });

    // Sign the request
    const signedRequest = await client.sign(request);

    // Perform the upload using standard fetch (Edge compatible)
    const response = await fetch(signedRequest);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('S3 Upload Error:', errorText);
        throw new Error(`S3 Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return url;
}

export async function putJSON(key: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data);
    const buffer = new TextEncoder().encode(jsonString);
    await uploadFileToS3(buffer, key, 'application/json');
}

export async function getJSON<T>(key: string): Promise<T | null> {
    const settings = getSettings();
    const { accessKeyId, secretAccessKey, region, bucketName } = settings.aws;

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) return null;

    const client = new AwsClient({
        accessKeyId,
        secretAccessKey,
        region,
        service: 's3',
    });

    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${encodedKey}`;

    const request = new Request(url, {
        method: 'GET',
    });

    const signedRequest = await client.sign(request);
    const response = await fetch(signedRequest);

    if (response.status === 404) return null;

    if (!response.ok) {
        console.warn('Failed to fetch JSON from S3:', response.status, response.statusText);
        return null;
    }

    return response.json();
}
