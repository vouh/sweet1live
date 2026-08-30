import { staffAuthHeaders } from "@/lib/staffAuth";

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not compress image.")), "image/webp", 0.78)
  );
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}

export function uploadEventImage(file: File, onProgress: (percent: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/events/upload");
    new Headers(staffAuthHeaders()).forEach((value, key) => request.setRequestHeader(key, value));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error("Upload interrupted. Your draft has been kept."));
    request.onload = () => {
      let payload: { url?: string; detail?: string } = {};
      try { payload = JSON.parse(request.responseText); } catch { /* use fallback below */ }
      if (request.status >= 200 && request.status < 300 && payload.url) resolve(payload.url);
      else reject(new Error(payload.detail || "Could not upload image."));
    };
    const form = new FormData();
    form.append("file", file);
    request.send(form);
  });
}
