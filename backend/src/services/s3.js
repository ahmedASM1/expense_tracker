import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function getUploadUrl(key, contentType = 'image/jpeg') {
    const command = new PutObjectCommand({
        Bucket:      process.env.AWS_S3_BUCKET,
        Key:         key,
        ContentType: contentType,
    });
    return getSignedUrl(s3, command, { expiresIn: 300 });
}

export async function getDownloadUrl(key) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key:    key,
    });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
}