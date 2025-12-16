
const { createHmac, createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

// Basic settings loader (since we can't easily import TS lib/settings in raw Node script without setup)
// We'll read from settings.json directly if it exists, or enviroment variables.
// The user already has settings.json in src/data/settings.json? No, likely src/data/settings.json
// Let's assume we can read src/data/settings.json

const settingsPath = path.join(__dirname, '../src/data/settings.json');
let settings;

try {
    if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
} catch (e) {
    console.error('Failed to load settings', e);
}

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || settings?.aws?.accessKeyId;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || settings?.aws?.secretAccessKey;
const region = process.env.AWS_REGION || settings?.aws?.region || 'ap-southeast-2';
const bucketName = process.env.AWS_BUCKET_NAME || settings?.aws?.bucketName || 'kamisibai';

if (!accessKeyId || !secretAccessKey) {
    console.error('No AWS credentials found');
    process.exit(1);
}

console.log(`Configuring CORS for bucket: ${bucketName} in ${region}`);

// Minimal AWS Client Logic (Copied/Adapted for Node.js script)
class AwsClient {
    constructor(config) {
        this.config = config;
    }

    async sign(request) {
        const url = new URL(request.url);
        const method = request.method;
        const headers = request.headers || {};

        const now = new Date();
        const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const dateStamp = amzDate.slice(0, 8);

        headers['host'] = url.host;
        headers['x-amz-date'] = amzDate;

        // Content-MD5 is required for PutBucketCors? S3 often requires it for XML bodies.
        // Let's compute it.
        const body = request.body || '';
        const md5 = createHash('md5').update(body).digest('base64');
        headers['content-md5'] = md5;

        // Canonical Request
        const canonicalUri = url.pathname;
        const canonicalQueryString = Array.from(url.searchParams).sort().map(([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
        ).join('&');

        // Normalize headers
        const lowerHeaders = {};
        Object.keys(headers).forEach(k => {
            lowerHeaders[k.toLowerCase()] = headers[k];
        });

        const sortedHeaders = Object.keys(lowerHeaders).sort();
        const canonicalHeaders = sortedHeaders.map(k => `${k}:${lowerHeaders[k].trim()}\n`).join('');
        const signedHeaders = sortedHeaders.join(';');

        const payloadHash = createHash('sha256').update(body).digest('hex');
        headers['x-amz-content-sha256'] = payloadHash;

        const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

        // String to Sign
        const algorithm = 'AWS4-HMAC-SHA256';
        const credentialScope = `${dateStamp}/${this.config.region}/${this.config.service}/aws4_request`;
        const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${createHash('sha256').update(canonicalRequest).digest('hex')}`;

        // Signature
        const kDate = createHmac('sha256', `AWS4${this.config.secretAccessKey}`).update(dateStamp).digest();
        const kRegion = createHmac('sha256', kDate).update(this.config.region).digest();
        const kService = createHmac('sha256', kRegion).update(this.config.service).digest();
        const kSigning = createHmac('sha256', kService).update('aws4_request').digest();
        const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

        headers['Authorization'] = `${algorithm} Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        return { url: url.toString(), options: { method, headers, body } };
    }
}

async function setCors() {
    const client = new AwsClient({
        accessKeyId,
        secretAccessKey,
        region,
        service: 's3'
    });

    const corsXml = `
<CORSConfiguration>
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>`.trim();

    const request = {
        url: `https://${bucketName}.s3.${region}.amazonaws.com/?cors`,
        method: 'PUT',
        body: corsXml,
        headers: {
            'Content-Type': 'application/xml'
        }
    };

    const signed = await client.sign(request);

    // Node.js fetch
    const fetch = await import('node-fetch').then(m => m.default).catch(() => global.fetch);

    try {
        const response = await fetch(signed.url, signed.options);
        if (response.ok) {
            console.log('Successfully set CORS configuration!');
        } else {
            const text = await response.text();
            console.error('Failed to set CORS:', response.status, text);
        }
    } catch (e) {
        console.error('Network error:', e);
    }
}

setCors();
