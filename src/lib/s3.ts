
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { getSettings } from './settings';

export async function uploadFileToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
    // Hardcoded credentials as requested
    // TODO: Replace these with your actual AWS credentials
    const accessKeyId = 'YOUR_ACCESS_KEY_ID';
    const secretAccessKey = 'YOUR_SECRET_ACCESS_KEY';
    const region = 'ap-northeast-1';
    const bucketName = 'YOUR_BUCKET_NAME';

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
        throw new Error('AWS credentials are not configured.');
    }

    const client = new S3Client({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey
        }
    });

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // ACL: 'public-read' // Note: Many buckets block ACLs now. Better to use Bucket Policy or CloudFront. 
        // For this prototype, we assume the bucket is public or we perform signed URL?
        // Requirement says "S3", usually implies public URL access for website assets.
    });

    await client.send(command);

    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}
