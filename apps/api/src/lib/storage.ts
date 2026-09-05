import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../env";
import { UPLOADS_ROOT } from "./uploads";

export const isR2Configured = !!(
  env.R2_ACCOUNT_ID &&
  env.R2_ACCESS_KEY_ID &&
  env.R2_SECRET_ACCESS_KEY &&
  env.R2_BUCKET_NAME &&
  env.R2_PUBLIC_URL
);

const r2Client = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
    })
  : null;

type UploadSubdir = "companies" | "employees" | "sinking-funds";

interface UploadableFile {
  file: NodeJS.ReadableStream & { truncated?: boolean };
  mimetype: string;
}

// drains the multipart stream into memory — split out from persistFile() so
// callers that need to inspect the bytes first (e.g. validating a QR code)
// can do that before deciding whether to store it anywhere
export async function readUploadedFile(file: UploadableFile): Promise<{ buffer: Buffer | null; truncated: boolean }> {
  const chunks: Buffer[] = [];
  for await (const chunk of file.file) {
    chunks.push(chunk as Buffer);
  }
  if (file.file.truncated) {
    return { buffer: null, truncated: true };
  }
  return { buffer: Buffer.concat(chunks), truncated: false };
}

// writes a buffer to Cloudflare R2 (when configured) or local disk (dev
// default) and returns the /uploads/... path to store on the record —
// callers don't need to know which backend actually served the file
export async function persistFile(
  buffer: Buffer,
  mimetype: string,
  subdir: UploadSubdir,
  filename: string
): Promise<string> {
  if (r2Client) {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: `${subdir}/${filename}`,
        Body: buffer,
        ContentType: mimetype,
      })
    );
  } else {
    const dir = path.join(UPLOADS_ROOT, subdir);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, filename), buffer);
  }

  return `/uploads/${subdir}/${filename}`;
}

// convenience wrapper for the common case: read + persist with no validation in between
export async function saveUploadedFile(
  file: UploadableFile,
  subdir: UploadSubdir,
  filename: string
): Promise<{ url: string | null; truncated: boolean }> {
  const { buffer, truncated } = await readUploadedFile(file);
  if (truncated || !buffer) {
    return { url: null, truncated: true };
  }
  const url = await persistFile(buffer, file.mimetype, subdir, filename);
  return { url, truncated: false };
}
