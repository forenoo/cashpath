import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Log R2 configuration (without sensitive data)
console.log("[R2 Client] Initializing with config:", {
  endpoint: R2_ENDPOINT,
  bucketName: process.env.R2_BUCKET_NAME,
  publicUrl: process.env.R2_PUBLIC_URL,
  hasAccountId: !!process.env.R2_ACCOUNT_ID,
  hasAccessKeyId: !!process.env.R2_ACCESS_KEY_ID,
  hasSecretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
});

export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME as string;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL as string;

type GeneratePresignedUploadUrlParams = {
  key: string;
  contentType: string;
  expiresIn?: number;
};

export async function generatePresignedUploadUrl(
  params: GeneratePresignedUploadUrlParams,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { key, contentType, expiresIn = 300 } = params;

  console.log("[R2 Client] Generating presigned URL:", {
    bucket: R2_BUCKET_NAME,
    key,
    contentType,
    expiresIn,
  });

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  console.log("[R2 Client] Presigned URL generated:", {
    publicUrl,
    uploadUrlLength: uploadUrl.length,
  });

  return { uploadUrl, publicUrl };
}

export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

export function extractKeyFromUrl(url: string): string | null {
  if (!url.startsWith(R2_PUBLIC_URL)) return null;
  return url.replace(`${R2_PUBLIC_URL}/`, "");
}
