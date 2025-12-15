
import { AwsClient } from './s3-signer';
import { getSettings } from './settings';

export async function uploadFileToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
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

    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    const request = new Request(url, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            // 'x-amz-acl': 'public-read', // Optional based on bucket policy
        },
        body: buffer,
    });

    // Sign the request
    const signedRequest = await client.sign(request);

    // Perform the upload using standard fetch (Edge compatible)
    const response = await fetch(signedRequest);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('S3 Upload Error:', errorText);
        throw new Error(`S3 Upload failed: ${response.status} ${response.statusText}`);
    }

    return url;
}
