import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 is S3-compatible, so we talk to it with the AWS SDK pointed
 * at the account's R2 endpoint. Chosen over a generic blob store because R2
 * has zero egress fees — every public tribute page view re-serves photos to
 * a new visitor, and that adds up.
 */
export function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/** Returns a short-lived presigned URL the browser can PUT a photo to directly. */
export async function createPresignedUploadUrl(key: string, contentType: string) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 300 });
}

export function publicUrlForKey(key: string) {
  return `https://${process.env.R2_PUBLIC_HOSTNAME}/${key}`;
}
