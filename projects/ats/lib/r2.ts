import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PRESIGN_EXPIRY_SECONDS = 15 * 60; // 15 minutes

export interface PresignedUploadResult {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

/**
 * Generate a presigned PUT URL for uploading a file to R2
 * 
 * @param tenantId - Tenant ID for object key scoping
 * @param applicationId - Application ID (or placeholder for pre-application uploads)
 * @param documentType - cv | rtw-document | offer-letter
 * @param filename - Original filename
 * @returns Presigned URL and object key
 */
export async function generatePresignedUploadUrl(
  tenantId: string,
  applicationId: string,
  documentType: string,
  filename: string
): Promise<PresignedUploadResult> {
  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Object key pattern: /{tenantId}/{applicationId}/{documentType}/{filename}
  const objectKey = `${tenantId}/${applicationId}/${documentType}/${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: PRESIGN_EXPIRY_SECONDS,
  });

  return {
    uploadUrl,
    objectKey,
    expiresIn: PRESIGN_EXPIRY_SECONDS,
  };
}

/**
 * Generate a presigned GET URL for downloading a file from R2
 * 
 * @param objectKey - Full object key
 * @returns Presigned download URL
 */
export async function generatePresignedDownloadUrl(objectKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  return await getSignedUrl(r2Client, command, {
    expiresIn: 60 * 60, // 1 hour
  });
}
