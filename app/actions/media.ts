"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { getDb } from "../db";
import { supplierMedia } from "../db/schema";
import { type AddMediaInput, inferMediaKind } from "../data/media";

export async function isBlobEnabled(): Promise<boolean> {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function listMedia(brand?: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(supplierMedia)
    .orderBy(asc(supplierMedia.sortOrder), asc(supplierMedia.id));
  if (brand) return rows.filter((r) => r.brand === brand);
  return rows;
}

export async function addMedia(input: AddMediaInput) {
  const db = getDb();
  const url = input.url.trim();
  if (!url) throw new Error("A media URL is required.");
  const title = input.title.trim();
  if (!title) throw new Error("A title is required.");
  const kind = input.kind ?? inferMediaKind(url, input.kind);
  const [row] = await db
    .insert(supplierMedia)
    .values({
      brand: input.brand,
      title,
      description: input.description?.trim() || null,
      url,
      kind,
      blobPathname: input.blobPathname?.trim() || null,
    })
    .returning();
  revalidatePath("/media");
  revalidatePath(`/share/${encodeURIComponent(input.brand)}`);
  return row;
}

export async function deleteMedia(id: number) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(supplierMedia)
    .where(eq(supplierMedia.id, id));
  if (row?.blobPathname && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(row.blobPathname);
    } catch {
      // If the blob is already gone, continue removing the DB record.
    }
  }
  await db.delete(supplierMedia).where(eq(supplierMedia.id, id));
  revalidatePath("/media");
  if (row) revalidatePath(`/share/${encodeURIComponent(row.brand)}`);
}
