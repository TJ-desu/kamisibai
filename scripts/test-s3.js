
// Mock standard Web APIs for Node.js environment
// Node.js 22 has global fetches and crypto, but just in case
if (!globalThis.crypto) {
    globalThis.crypto = require('crypto').webcrypto;
}

const encoder = new TextEncoder();

async function hmac(key, string) {
    const cryptoKey =
        (key instanceof ArrayBuffer || key instanceof Uint8Array)
            ? await crypto.subtle.importKey(
                "raw",
                key,
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"]
            )
            : key;
    return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(string));
}

async function sha256(string) {
    return crypto.subtle.digest("SHA-256", encoder.encode(string));
}

function toHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

class AwsClient {
    constructor({ accessKeyId, secretAccessKey, region, service = "s3" }) {
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.region = region;
        this.service = service;
    }

    async sign(input, init) {
        const request = input instanceof Request ? input : new Request(input, init);
        const url = new URL(request.url);
        const method = request.method;
        const now = new Date();
        const headers = new Headers(request.headers);

        headers.set("Host", url.host);

        const datetime = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
        const date = datetime.slice(0, 8);
        headers.set("X-Amz-Date", datetime);

        let payload = "UNSIGNED-PAYLOAD";
        if (request.body) {
            // For test script simplicity with small buffer: calc SHA256 of body
            // This is safer for simple PUTs than UNSIGNED-PAYLOAD if bucket policy is strict
            // But let's try UNSIGNED-PAYLOAD first as per my code
            headers.set("x-amz-content-sha256", "UNSIGNED-PAYLOAD");
        } else {
            const emptyHash = await sha256("");
            headers.set("x-amz-content-sha256", toHex(emptyHash));
        }

        const sortedHeaderKeys = Array.from(headers.keys())
            .map(k => k.toLowerCase())
            .sort();

        const canonicalHeaders = sortedHeaderKeys
            .map(k => `${k}:${headers.get(k).trim()}\n`)
            .join("");

        const signedHeaders = sortedHeaderKeys.join(";");

        const canonicalRequest = [
            method,
            url.pathname,
            (url.searchParams.sort(), url.searchParams.toString()),
            canonicalHeaders,
            signedHeaders,
            headers.get("x-amz-content-sha256") || "UNSIGNED-PAYLOAD"
        ].join("\n");

        const credentialScope = `${date}/${this.region}/${this.service}/aws4_request`;

        const stringToSign = [
            "AWS4-HMAC-SHA256",
            datetime,
            credentialScope,
            toHex(await sha256(canonicalRequest))
        ].join("\n");

        const kDate = await hmac(encoder.encode(`AWS4${this.secretAccessKey}`), date);
        const kRegion = await hmac(kDate, this.region);
        const kService = await hmac(kRegion, this.service);
        const kSigning = await hmac(kService, "aws4_request");

        const signature = toHex(await hmac(kSigning, stringToSign));

        request.headers.set(
            "Authorization",
            `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
        );

        return request;
    }
}

// Credentials (Decoded manually for this script)
const accessKeyId = atob("ENC_QUtJQTNWREpVUVRNWFdMVEg3M0Y=".slice(4));
const secretAccessKey = atob("ENC_SVhrTHhHU3QzQURHbXJkXldVeGFYeHTVaOXBKNEpPdUdYekMvbkZW".slice(4));
const region = "ap-southeast-2";
const bucketName = "kamisibai";

console.log("Credentials:", { accessKeyId, region, bucketName, secretLength: secretAccessKey.length });

async function run() {
    const client = new AwsClient({
        accessKeyId,
        secretAccessKey,
        region,
        service: 's3',
    });

    const key = `test-${Date.now()}.txt`;
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    const content = "Hello S3 from Node.js script!";
    const buffer = Buffer.from(content); // Node.js buffer

    console.log("Attempting upload to:", url);

    const request = new Request(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: buffer,
    });

    try {
        const signedRequest = await client.sign(request);
        const response = await fetch(signedRequest);

        console.log("Response Status:", response.status);
        console.log("Response Text:", await response.text());

        if (response.ok) {
            console.log("SUCCESS!");
        } else {
            console.log("FAILED");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
