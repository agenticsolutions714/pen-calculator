export type MediaKind = "image" | "video" | "pdf" | "link";

export type AddMediaInput = {
  brand: string;
  title: string;
  description?: string | null;
  url: string;
  kind?: MediaKind | null;
  blobPathname?: string | null;
};

export function inferMediaKind(
  url: string,
  mimeOrKind?: string | null,
): MediaKind {
  const v = (mimeOrKind || "").toLowerCase();
  if (v.startsWith("image") || v === "image") return "image";
  if (v.startsWith("video") || v === "video") return "video";
  if (v.includes("pdf") || v === "pdf") return "pdf";
  const u = url.toLowerCase().split("?")[0];
  if (/\.(png|jpe?g|webp|gif|avif|heic)$/.test(u)) return "image";
  if (/\.(mp4|mov|webm|m4v|avi)$/.test(u)) return "video";
  if (/\.pdf$/.test(u)) return "pdf";
  return "link";
}
