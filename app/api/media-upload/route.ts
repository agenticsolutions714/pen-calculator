import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Client-upload token endpoint for Vercel Blob. The browser requests an
// upload token here, then uploads the file directly to Blob storage. This
// only works when BLOB_READ_WRITE_TOKEN is configured for the project.
export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        access: "public",
        allowedContentTypes: [
          "image/*",
          "video/*",
          "application/pdf",
        ],
        maximumSizeInBytes: 1024 * 1024 * 1024, // 1 GB
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // Persisting to the DB happens client-side after upload resolves,
        // so nothing is required here.
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 400 },
    );
  }
}
