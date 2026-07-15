import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

let client: S3Client | null = null;

export function isConfigured(): boolean {
  return Boolean(env.r2.endpoint && env.r2.accessKeyId && env.r2.secretAccessKey);
}

function s3(): S3Client {
  if (!isConfigured()) throw new Error("R2 não configurado (R2_ENDPOINT/ACCESS_KEY/SECRET).");
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: env.r2.endpoint,
      credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
      },
    });
  }
  return client;
}

export async function uploadFile(key: string, filePath: string, contentType: string): Promise<void> {
  const body = await readFile(filePath);
  await s3().send(
    new PutObjectCommand({ Bucket: env.r2.bucket, Key: key, Body: body, ContentType: contentType })
  );
}

export async function downloadToFile(key: string, destPath: string): Promise<void> {
  const res = await s3().send(new GetObjectCommand({ Bucket: env.r2.bucket, Key: key }));
  const body = res.Body as Readable | undefined;
  if (!body) throw new Error(`Objeto vazio: ${key}`);
  await pipeline(body, createWriteStream(destPath));
}

export async function signedUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: env.r2.bucket, Key: key }), {
    expiresIn,
  });
}
