"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APPROVAL_TYPES } from "@/lib/enums";
import { startApprovalUploadAction, finishApprovalUploadAction } from "@/lib/actions/approval-actions";

export function ApprovalUploadForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [accountId, setAccountId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("CREATIVE");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!accountId || !title.trim() || !file) return;

    setError(null);
    setPending(true);
    try {
      const start = await startApprovalUploadAction({ accountId, fileName: file.name, size: file.size });
      if ("error" in start) {
        setError(start.error);
        return;
      }

      const putResponse = await fetch(start.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" },
        body: file,
      });
      if (!putResponse.ok) {
        setError("A feltöltés sikertelen volt.");
        return;
      }

      const finish = await finishApprovalUploadAction({ accountId, path: start.path, title, type });
      if ("error" in finish) {
        setError(finish.error);
        return;
      }

      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("A feltöltés sikertelen volt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
      <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
        <option value="" disabled>
          Ügyfél...
        </option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Cím (pl. Nyitóoldal – bannerkép v2)"
        required
        className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm sm:col-span-2"
      />
      <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
        {APPROVAL_TYPES.map((t) => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </select>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        required
        className="rounded-lg border border-zinc-300 px-2 py-1 text-sm file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs"
      />
      <button disabled={pending} className="rounded-lg bg-brand-gold px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-5">
        {pending ? "Feltöltés..." : "+ Feltöltés jóváhagyásra"}
      </button>
      {error ? <p className="text-xs text-red-600 sm:col-span-5">{error}</p> : null}
    </form>
  );
}
