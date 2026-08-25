import { supabase } from "@/lib/supabase";

export const MATCH_EVIDENCE_BUCKET = "match-evidence";
export const DEPOSIT_RECEIPTS_BUCKET = "deposit-receipts";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

export async function uploadUserImage(bucket: string, folderSegments: string[], file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Subí una imagen JPG, PNG, WebP o GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen no puede superar 5 MB.");
  }
  if (folderSegments.some((segment) => !segment.trim())) {
    throw new Error("No se pudo armar la ruta del archivo.");
  }

  const unique = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : `${Date.now()}`;
  const path = `${folderSegments.join("/")}/${Date.now()}-${unique}.${extensionFor(file.type)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("No se pudo obtener la URL del archivo.");
  return { path, url: data.publicUrl };
}
