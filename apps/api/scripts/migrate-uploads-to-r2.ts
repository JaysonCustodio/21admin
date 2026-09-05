// one-time migration: uploads/* served locally before R2 was configured need
// to actually exist in the bucket too, since /uploads/* now unconditionally
// redirects there once R2 is configured — run with:
//   pnpm --filter api exec tsx scripts/migrate-uploads-to-r2.ts
import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../src/env";
import { UPLOADS_ROOT } from "../src/lib/uploads";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

async function main() {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    console.error("R2 env vars are not fully set — nothing to migrate to.");
    process.exit(1);
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  });

  const subdirs = fs.readdirSync(UPLOADS_ROOT, { withFileTypes: true }).filter((e) => e.isDirectory());
  let count = 0;

  for (const subdir of subdirs) {
    const dirPath = path.join(UPLOADS_ROOT, subdir.name);
    const files = fs.readdirSync(dirPath).filter((f) => f !== ".gitkeep");

    for (const filename of files) {
      const filePath = path.join(dirPath, filename);
      const body = fs.readFileSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      const key = `${subdir.name}/${filename}`;

      await client.send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: key,
          Body: body,
          ContentType: MIME_TYPES[ext] ?? "application/octet-stream",
        })
      );
      console.log(`uploaded ${key} (${body.length} bytes)`);
      count++;
    }
  }

  console.log(`\nDone — migrated ${count} file(s) to R2 bucket "${env.R2_BUCKET_NAME}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
