"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrganizationBrandingAction, startLogoUploadAction, finishLogoUploadAction } from "@/lib/actions/org-actions";

export function OrganizationBrandingForm({
  orgName,
  logoDisplayUrl,
  primaryColor,
  customDomain,
}: {
  orgName: string;
  logoDisplayUrl: string | null;
  primaryColor: string | null;
  customDomain: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const logoFile = logoInputRef.current?.files?.[0];
      if (logoFile) {
        const start = await startLogoUploadAction({ fileName: logoFile.name, size: logoFile.size });
        if ("error" in start) {
          setError(start.error);
          return;
        }
        const putResponse = await fetch(start.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": logoFile.type || "application/octet-stream", "x-upsert": "false" },
          body: logoFile,
        });
        if (!putResponse.ok) {
          setError("A logó feltöltése sikertelen volt.");
          return;
        }
        const finish = await finishLogoUploadAction({ path: start.path });
        if ("error" in finish) {
          setError(finish.error);
          return;
        }
      }

      if (formRef.current) {
        await updateOrganizationBrandingAction(new FormData(formRef.current));
      }
      if (logoInputRef.current) logoInputRef.current.value = "";
      router.refresh();
    } catch {
      setError("A mentés sikertelen volt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-zinc-100 pt-3">
      <div className="flex items-center gap-3">
        {logoDisplayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- felhasználó által feltöltött, nem build-időben ismert méretű logó
          <img src={logoDisplayUrl} alt="Logó" className="h-10 w-10 rounded-lg object-contain" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold text-sm font-bold text-white">{orgName.slice(0, 1)}</div>
        )}
        <label className="text-xs font-medium text-zinc-600">
          Logó csere
          <input ref={logoInputRef} name="logo" type="file" accept="image/*" className="mt-1 block text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs" />
        </label>
      </div>
      <label className="block text-xs font-medium text-zinc-600">
        Elsődleges márkaszín
        <div className="mt-1 flex items-center gap-2">
          <input name="primaryColor" type="color" defaultValue={primaryColor ?? "#4a102a"} className="h-8 w-12 rounded border border-zinc-300" />
          <span className="font-mono text-xs text-zinc-500">{primaryColor ?? "#4a102a (alapértelmezett)"}</span>
        </div>
      </label>
      <label className="block text-xs font-medium text-zinc-600">
        Egyedi domain
        <input name="customDomain" defaultValue={customDomain ?? ""} placeholder="crm.ugynokseged.hu" className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
      </label>
      <p className="text-xs text-zinc-400">
        A domain itt csak rögzítésre kerül - a tényleges DNS-kötéshez add hozzá ugyanezt a domaint a Vercel
        projekt &quot;Domains&quot; beállításainál, és állítsd be a kért DNS rekordot a domain-szolgáltatódnál.
      </p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button disabled={pending} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
        {pending ? "Mentés..." : "Mentés"}
      </button>
    </form>
  );
}
