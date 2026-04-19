import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fashion-app-uploads';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export class StorageService {
  /**
   * Upload a file to Cloudflare R2
   */
  static async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata || {},
      });

      await r2Client.send(command);

      return {
        key,
        url: `https://${BUCKET_NAME}.${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`,
        size: buffer.length,
        contentType,
      };
    } catch (error) {
      console.error('Failed to upload file to R2:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Generate a presigned URL for uploading
   */
  static async getUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(r2Client, command, { expiresIn });
    } catch (error) {
      console.error('Failed to generate upload URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate a presigned URL for downloading
   */
  static async getDownloadUrl(
    key: string,
    expiresIn = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(r2Client, command, { expiresIn });
    } catch (error) {
      console.error('Failed to generate download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Delete a file from Cloudflare R2
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await r2Client.send(command);
    } catch (error) {
      console.error('Failed to delete file from R2:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Generate a unique file key
   */
  static generateFileKey(
    userId: string,
    originalName: string,
    folder: string = 'uploads'
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = originalName.split('.').pop();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${folder}/${userId}/${timestamp}-${random}-${sanitizedName}`;
  }

  /**
   * Get public URL for a file (if bucket is public)
   */
  static getPublicUrl(key: string): string {
    return `https://pub-${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.dev/${key}`;
  }
}

export { r2Client, BUCKET_NAME };
