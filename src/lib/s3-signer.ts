
// Minimal AWS Signature V4 implementation for Cloudflare Workers / Edge Runtime
// Uses Web Crypto API (crypto.subtle) which is available in Edge Runtime.
// No external dependencies.

const encoder = new TextEncoder();

async function hmac(key: CryptoKey | ArrayBuffer | Uint8Array, string: string) {
    const cryptoKey =
        (key instanceof ArrayBuffer || key instanceof Uint8Array)
            ? await crypto.subtle.importKey(
                "raw",
                key as any,
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"]
            )
            : key as CryptoKey;
    return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(string));
}

async function sha256(string: string) {
    return crypto.subtle.digest("SHA-256", encoder.encode(string));
}

function toHex(buffer: ArrayBuffer) {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export class AwsClient {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    service: string;

    constructor({ accessKeyId, secretAccessKey, region, service = "s3" }: { accessKeyId: string; secretAccessKey: string; region: string; service?: string }) {
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.region = region;
        this.service = service;
    }

    async sign(input: string | Request, init?: RequestInit): Promise<Request> {
        const request = input instanceof Request ? input : new Request(input, init);
        const url = new URL(request.url);
        const method = request.method;
        const now = new Date();
        const headers = new Headers(request.headers);

        // Host header is required for SigV4
        headers.set("Host", url.host);

        // Identify the request date
        const datetime = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
        const date = datetime.slice(0, 8);
        headers.set("X-Amz-Date", datetime);

        // Calculate body hash (payload hash)
        let payload = "UNSIGNED-PAYLOAD";
        if (request.body) {
            // Note: Reading body on Edge might consume it.
            // For large files, we might want UNSIGNED-PAYLOAD if we can't buffer it.
            // But for compatibility, let's assume we can use UNSIGNED-PAYLOAD for S3 uploads 
            // if usage is over HTTPS, which is standard.
            // However, some S3 configs require valid payload hash.
            // For simplicity and performance on massive files, UNSIGNED-PAYLOAD is preferred for streaming.
            headers.set("x-amz-content-sha256", "UNSIGNED-PAYLOAD");
        } else {
            const emptyHash = await sha256("");
            headers.set("x-amz-content-sha256", toHex(emptyHash));
        }

        // Canonical Headers
        const sortedHeaderKeys = Array.from(headers.keys())
            .map(k => k.toLowerCase())
            .sort();

        const canonicalHeaders = sortedHeaderKeys
            .map(k => `${k}:${headers.get(k)!.trim()}\n`)
            .join("");

        const signedHeaders = sortedHeaderKeys.join(";");

        // Canonical Request
        const canonicalRequest = [
            method,
            url.pathname,
            (url.searchParams.sort(), url.searchParams.toString()), // Sort in place, then stringify
            canonicalHeaders,
            signedHeaders,
            headers.get("x-amz-content-sha256") || "UNSIGNED-PAYLOAD"
        ].join("\n");

        // Scope
        const credentialScope = `${date}/${this.region}/${this.service}/aws4_request`;

        // String to Sign
        const stringToSign = [
            "AWS4-HMAC-SHA256",
            datetime,
            credentialScope,
            toHex(await sha256(canonicalRequest))
        ].join("\n");

        // Signing Key
        const kDate = await hmac(encoder.encode(`AWS4${this.secretAccessKey}`), date);
        const kRegion = await hmac(kDate, this.region);
        const kService = await hmac(kRegion, this.service);
        const kSigning = await hmac(kService, "aws4_request");

        // Signature
        const signature = toHex(await hmac(kSigning, stringToSign));

        // Apply headers to the request object
        request.headers.set("X-Amz-Date", datetime);
        request.headers.set("x-amz-content-sha256", headers.get("x-amz-content-sha256") || "UNSIGNED-PAYLOAD");

        // Authorization Header
        request.headers.set(
            "Authorization",
            `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
        );

        return request;
    }

    async getPresignedUrl(urlStr: string, expiresIn: number = 3600): Promise<string> {
        const url = new URL(urlStr);
        const now = new Date();
        const datetime = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
        const date = datetime.slice(0, 8);

        // Scope
        const credentialScope = `${date}/${this.region}/${this.service}/aws4_request`;

        // Query Params
        url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
        url.searchParams.set("X-Amz-Credential", `${this.accessKeyId}/${credentialScope}`);
        url.searchParams.set("X-Amz-Date", datetime);
        url.searchParams.set("X-Amz-Expires", expiresIn.toString());
        url.searchParams.set("X-Amz-SignedHeaders", "host");

        // Canonical Headers (just host)
        const canonicalHeaders = `host:${url.host}\n`;
        const signedHeaders = "host";

        // Canonical Request
        // Note: URLSearchParams sorting is critical for SigV4
        const canonicalRequest = [
            "GET",
            url.pathname,
            (url.searchParams.sort(), url.searchParams.toString()),
            canonicalHeaders,
            signedHeaders,
            "UNSIGNED-PAYLOAD"
        ].join("\n");

        // String to Sign
        const stringToSign = [
            "AWS4-HMAC-SHA256",
            datetime,
            credentialScope,
            toHex(await sha256(canonicalRequest))
        ].join("\n");

        // Signature
        const kDate = await hmac(encoder.encode(`AWS4${this.secretAccessKey}`), date);
        const kRegion = await hmac(kDate, this.region);
        const kService = await hmac(kRegion, this.service);
        const kSigning = await hmac(kService, "aws4_request");
        const signature = toHex(await hmac(kSigning, stringToSign));

        url.searchParams.set("X-Amz-Signature", signature);

        return url.toString();
    }
}
