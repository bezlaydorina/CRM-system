"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startFileUploadAction, finishFileUploadAction } from "@/lib/actions/file-actions";

export function FileUploadForm() {
  const [folder, setFolder] = useState("IMAGES");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setError(null);
    setPending(true);
    try {
      const start = await startFileUploadAction({ fileName: file.name, size: file.size });
      if ("error" in start) {
        setError(start.error);
        return;
      }

      const contentType = file.type || "application/octet-stream";
      const putResponse = await fetch(start.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType, "x-upsert": "false" },
        body: file,
      });
      if (!putResponse.ok) {
        setError("A feltöltés sikertelen volt.");
        return;
      }

      const finish = await finishFileUploadAction({ path: start.path, fileName: file.name, folder, contentType });
      if ("error" in finish) {
        setError(finish.error);
        return;
      }

      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      setError("A feltöltés sikertelen volt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-3">
      <input ref={inputRef} name="file" type="file" required className="text-sm" />
      <select value={folder} onChange={(e) => setFolder(e.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
        <option value="IMAGES">Kép</option>
        <option value="VIDEOS">Videó</option>
        <option value="OTHER">Egyéb</option>
      </select>
      <button disabled={pending} className="rounded-lg bg-brand-gold px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? "Feltöltés..." : "Feltöltés"}
      </button>
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
    </form>
  );
}
