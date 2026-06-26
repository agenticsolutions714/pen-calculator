import { listMedia, isBlobEnabled } from "../actions/media";
import { products } from "../data/products";
import Nav from "../components/Nav";
import MediaManager from "./MediaManager";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  let media: Awaited<ReturnType<typeof listMedia>> = [];
  let loadError: string | null = null;
  try {
    media = await listMedia();
  } catch {
    loadError =
      "Could not load media. Make sure the database is connected.";
  }

  const brands = [...new Set(products.map((p) => p.brand))];

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Nav />
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Media library
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Upload marketing media (photos, videos, PDFs) per supplier. Reps
            share a clean, no-login gallery link with buyers.
          </p>
        </header>

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : (
          <MediaManager
            initialMedia={media}
            brands={brands}
            blobEnabled={await isBlobEnabled()}
          />
        )}
      </div>
    </main>
  );
}
