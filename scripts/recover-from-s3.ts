import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';

// Credentials provided by user (Redacted for git push)
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

const region = "ap-southeast-2";
const bucketName = "kamisibai";

async function sha256(message: string) {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(message).digest('hex');
}

async function hmac(key: string | Buffer, message: string) {
    return createHmac('sha256', key).update(message).digest();
}

async function hmacHex(key: string | Buffer, message: string) {
    return createHmac('sha256', key).update(message).digest('hex');
}

class S3Client {
    private accessKey: string;
    private secretKey: string; // Changed back to string
    private region: string;
    private bucket: string;

    constructor(accessKey: string, secretKey: string, region: string, bucket: string) {
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.region = region;
        this.bucket = bucket;
    }

    async listObjects() {
        const method = 'GET';
        const service = 's3';
        const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
        const path = '/';

        // Use URLSearchParams for correct encoding/sorting
        const params = new URLSearchParams();
        params.append('list-type', '2');
        params.append('prefix', 'videos/');
        params.sort();
        const query = params.toString(); // This encodes 'videos/' to 'videos%2F' which is what AWS wants in canonical query

        const now = new Date();
        const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
        const dateStamp = amzDate.slice(0, 8);

        // Canonical Request
        const canonicalUri = path;

        const canonicalHeaders = `host:${host}\nx-amz-content-sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\nx-amz-date:${amzDate}\n`;
        const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
        const payloadHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // Empty payload

        const canonicalRequest = `${method}\n${canonicalUri}\n${query}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

        // String to Sign
        const algorithm = 'AWS4-HMAC-SHA256';
        const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
        const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;

        // Signing Key
        const kDate = await hmac(`AWS4${this.secretKey}`, dateStamp);
        const kRegion = await hmac(kDate, this.region);
        const kService = await hmac(kRegion, service);
        const kSigning = await hmac(kService, 'aws4_request');

        const signature = (await hmacHex(kSigning, stringToSign));

        const authorization = `${algorithm} Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        const url = `https://${host}${path}?${query}`;
        const response = await fetch(url, {
            headers: {
                'x-amz-date': amzDate,
                'x-amz-content-sha256': payloadHash,
                'Authorization': authorization
            }
        });

        if (!response.ok) {
            throw new Error(`S3 List Failed: ${response.status} ${await response.text()}`);
        }

        const xml = await response.text();
        return this.parseXmlKeys(xml);
    }

    parseXmlKeys(xml: string) {
        // Simple regex parse for <Key>videos/...</Key>
        const keys: string[] = [];
        const regex = /<Key>(.*?)<\/Key>/g;
        let match;
        while ((match = regex.exec(xml)) !== null) {
            if (match[1].startsWith('videos/') && match[1] !== 'videos/') {
                keys.push(match[1]);
            }
        }
        return keys;
    }
}

async function main() {
    console.log('Starting S3 Recovery...');
    try {
        const s3 = new S3Client(accessKeyId, secretAccessKey, region, bucketName);
        const keys = await s3.listObjects();
        console.log(`Found ${keys.length} files in S3.`);

        for (const key of keys) {
            const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
            // Extract title from filename (remove videos/ prefix and extension)
            const filename = key.split('/').pop() || 'Untitled';

            // Try to find if this URL already exists
            const existing = await prisma.video.findFirst({
                where: { url: url }
            });

            if (!existing) {
                console.log(`Recovering: ${key}`);
                await prisma.video.create({
                    data: {
                        title: filename,
                        description: 'Recovered from S3',
                        url: url,
                        tags: ['Recovered'],
                        // Generate a thumbnail placeholder
                        thumbnail: `https://placehold.co/600x400/b1a08a/ffffff?text=${encodeURIComponent(filename)}`
                    }
                });
            } else {
                console.log(`Skipping existing: ${key}`);
            }
        }
    } catch (e) {
        console.error('Recovery failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
