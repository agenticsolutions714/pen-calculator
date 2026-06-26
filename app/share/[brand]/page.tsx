import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listMedia } from "../../actions/media";
import { type MediaKind } from "../../data/media";
import { products } from "../../data/products";
import type { SupplierMediaRow } from "../../db/schema";

export const dynamic = "force-dynamic";

const BROKERAGE = "Aura";

function resolveBrand(raw: string): string | null {
  const decoded = decodeURIComponent(raw);
  const brands = [...new Set(products.map((p) => p.brand))];
  return (
    brands.find((b) => b.toLowerCase() === decoded.toLowerCase()) ?? null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const resolved = resolveBrand(brand);
  return {
    title: resolved ? `${resolved} — ${BROKERAGE}` : BROKERAGE,
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  const resolved = resolveBrand(brand);
  if (!resolved) notFound();

  let media: SupplierMediaRow[] = [];
  try {
    media = await listMedia(resolved);
  } catch {
    media = [];
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-base font-bold text-white">
            {BROKERAGE.charAt(0)}
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {BROKERAGE}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {resolved} catalog
            </h1>
          </div>
        </header>

        {media.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">
            No media available yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((m) => (
              <article
                key={m.id}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
              >
                <Preview kind={m.kind as MediaKind} url={m.url} title={m.title} />
                <div className="p-4">
                  <h2 className="text-sm font-semibold text-neutral-900">
                    {m.title}
                  </h2>
                  {m.description ? (
                    <p className="mt-1 text-sm text-neutral-500">
                      {m.description}
                    </p>
                  ) : null}
                  {(m.kind === "pdf" || m.kind === "link") && (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
                    >
                      {m.kind === "pdf" ? "Open PDF" : "Open link"}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-12 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400">
          All inventory is local and US-based. Whitelabel vials with clear
          caps. · {BROKERAGE}
        </footer>
      </div>
    </main>
  );
}

function Preview({
  kind,
  url,
  title,
}: {
  kind: MediaKind;
  url: string;
  title: string;
}) {
  if (kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={title}
        className="h-52 w-full bg-neutral-50 object-cover"
      />
    );
  }
  if (kind === "video") {
    return (
      <video src={url} controls className="h-52 w-full bg-black object-contain" />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-52 w-full items-center justify-center bg-neutral-50 text-sm font-medium text-neutral-400 hover:bg-neutral-100"
    >
      {kind === "pdf" ? "PDF document" : "View link"}
    </a>
  );
}
