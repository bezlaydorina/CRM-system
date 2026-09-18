import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getEffectiveAccountId } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { uploadFileAction } from "@/lib/actions/file-actions";

export default async function PortalFilesPage() {
  const accountId = (await getEffectiveAccountId())!;
  const files = await prisma.fileAsset.findMany({ where: { accountId }, orderBy: { uploadedAt: "desc" } });

  const folders = ["IMAGES", "VIDEOS", "OTHER"] as const;
  const labels: Record<string, string> = { IMAGES: "Képek", VIDEOS: "Videók", OTHER: "Egyéb" };

  return (
    <div>
      <PageHeader title="Képek feltöltése" subtitle="Nem kell rendszerezned, csak töltsd fel – mi elrendezzük" />

      <Card className="mb-6">
        <form action={uploadFileAction} className="flex flex-wrap items-end gap-3">
          <input name="file" type="file" required className="text-sm" />
          <select name="folder" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
            <option value="IMAGES">Kép</option>
            <option value="VIDEOS">Videó</option>
            <option value="OTHER">Egyéb</option>
          </select>
          <button className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white">Feltöltés</button>
        </form>
      </Card>

      {folders.map((folder) => {
        const items = files.filter((f) => f.folder === folder);
        return (
          <div key={folder} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-zinc-700">{labels[folder]}</h2>
            {items.length === 0 ? (
              <EmptyState text="Még nincs feltöltött fájl" />
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {items.map((f) => (
                  <div key={f.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                    <div className="relative aspect-square bg-zinc-100">
                      {f.fileType === "image" ? (
                        <Image src={f.fileUrl} alt={f.fileName} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">🎬</div>
                      )}
                    </div>
                    <p className="truncate p-1 text-[11px] text-zinc-500">{f.fileName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
