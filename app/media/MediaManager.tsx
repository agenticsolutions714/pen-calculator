"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import type { SupplierMediaRow } from "../db/schema";
import { addMedia, deleteMedia } from "../actions/media";
import type { MediaKind } from "../data/media";

type Props = {
  initialMedia: SupplierMediaRow[];
  brands: string[];
  blobEnabled: boolean;
};

function kindFromFile(file: File): MediaKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "link";
}

export default function MediaManager({
  initialMedia,
  brands,
  blobEnabled,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [brand, setBrand] = useState(brands[0] ?? "Standard");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, SupplierMediaRow[]>();
    for (const m of initialMedia) {
      const arr = map.get(m.brand) ?? [];
      arr.push(m);
      map.set(m.brand, arr);
    }
    return map;
  }, [initialMedia]);

  const shareUrl = (b: string) =>
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${encodeURIComponent(b)}`
      : `/share/${encodeURIComponent(b)}`;

  const copyShare = async (b: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(b));
      setCopied(b);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("Could not copy link. Copy it from the address bar instead.");
    }
  };

  const saveLink = () => {
    setError(null);
    setMsg(null);
    if (!title.trim()) {
      setError("Add a title.");
      return;
    }
    if (!linkUrl.trim()) {
      setError("Paste a media URL, or use Upload file instead.");
      return;
    }
    startTransition(async () => {
      try {
        await addMedia({
          brand,
          title,
          description,
          url: linkUrl,
        });
        setTitle("");
        setDescription("");
        setLinkUrl("");
        setMsg("Media added.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add media.");
      }
    });
  };

  const handleFile = async (file: File) => {
    setError(null);
    setMsg(null);
    if (!title.trim()) {
      setError("Add a title before uploading.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const result = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/media-upload",
      });
      await addMedia({
        brand,
        title,
        description,
        url: result.url,
        kind: kindFromFile(file),
        blobPathname: result.pathname,
      });
      setTitle("");
      setDescription("");
      setMsg("File uploaded and added.");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Upload failed. You can paste a link instead.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = (m: SupplierMediaRow) => {
    if (!confirm(`Delete "${m.title}"?`)) return;
    startTransition(async () => {
      await deleteMedia(m.id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {!blobEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          File uploads need Vercel Blob, which isn&apos;t enabled yet. You can
          still add media right now by pasting a link (Google Drive, Dropbox,
          YouTube, a direct image/PDF URL, etc.). Uploads will turn on
          automatically once Blob storage is connected.
        </div>
      ) : null}

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Add media
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-neutral-500">
              Supplier
            </span>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-neutral-500">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product photo — front label"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-neutral-500">
              Description (optional)
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note buyers will see under the title"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Upload a file
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Images, videos, or PDFs.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*,application/pdf"
              disabled={!blobEnabled || uploading || isPending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="mt-3 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-700 disabled:opacity-50"
            />
            {uploading ? (
              <p className="mt-2 text-xs text-neutral-500">Uploading…</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Or paste a link
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Any hosted image, video, PDF, or share link.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
              <button
                onClick={saveLink}
                disabled={isPending}
                className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {msg ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {msg}
          </p>
        ) : null}
      </section>

      {brands.map((b) => {
        const items = grouped.get(b) ?? [];
        return (
          <section
            key={b}
            className="rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {b}{" "}
                <span className="ml-1 text-neutral-400">
                  ({items.length})
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyShare(b)}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                >
                  {copied === b ? "Copied!" : "Copy buyer link"}
                </button>
                <a
                  href={`/share/${encodeURIComponent(b)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
                >
                  Open gallery
                </a>
              </div>
            </div>
            {items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-neutral-400">
                No media for {b} yet.
              </p>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
                  >
                    <MediaPreview kind={m.kind as MediaKind} url={m.url} title={m.title} />
                    <div className="p-3">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {m.title}
                      </p>
                      {m.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                          {m.description}
                        </p>
                      ) : null}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                          {m.kind}
                        </span>
                        <button
                          onClick={() => remove(m)}
                          className="text-xs font-medium text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function MediaPreview({
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
        className="h-40 w-full bg-neutral-50 object-cover"
      />
    );
  }
  if (kind === "video") {
    return <video src={url} controls className="h-40 w-full bg-black object-contain" />;
  }
  const label = kind === "pdf" ? "PDF" : "LINK";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-40 w-full items-center justify-center bg-neutral-50 text-sm font-medium text-neutral-400 hover:bg-neutral-100"
    >
      {label} · open
    </a>
  );
}
