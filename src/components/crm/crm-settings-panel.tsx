"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { CUSTOM_FIELD_TYPES } from "@/lib/enums";
import {
  createPipelineAction,
  setDefaultPipelineAction,
  addStageAction,
  deleteStageAction,
  addCustomFieldAction,
  deleteCustomFieldAction,
  createWebhookAction,
  deleteWebhookAction,
  regenerateWebhookAction,
} from "@/lib/actions/crm-actions";
import { updateCrmSettingsAction } from "@/lib/actions/account-actions";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";

type Stage = { id: string; name: string; color: string; order: number };
type CustomFieldDef = { id: string; name: string; type: string; section: string; options: string };
type Webhook = { id: string; name: string; token: string; stageId: string };
type Pipeline = { id: string; name: string; isDefault: boolean; stages: Stage[]; customFieldDefs: CustomFieldDef[]; webhooks: Webhook[] };
type ActivityEntry = { id: string; message: string; type: string; createdAt: Date; actor: { name: string } | null };

export function CrmSettingsPanel({
  accountId,
  pipelines,
  activePipeline,
  sourceCounts,
  nameFormat,
  callButtonEnabled,
  activity,
}: {
  accountId: string;
  pipelines: Pipeline[];
  activePipeline: Pipeline;
  sourceCounts: Record<string, number>;
  nameFormat: string;
  callButtonEnabled: boolean;
  activity: ActivityEntry[];
}) {
  const [activityFilter, setActivityFilter] = useState("");
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    // window is only available client-side; reading it here (rather than
    // during render) is unavoidable for a server-rendered component.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Pipeline-ok</h2>
        <div className="space-y-1.5">
          {pipelines.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-1.5 text-sm">
              <span>{p.name}</span>
              {p.isDefault ? (
                <Badge color="indigo">Alapértelmezett</Badge>
              ) : (
                <form action={setDefaultPipelineAction.bind(null, accountId, p.id)}>
                  <button className="text-xs text-indigo-600 hover:underline">Legyen alapértelmezett</button>
                </form>
              )}
            </div>
          ))}
        </div>
        <form action={createPipelineAction.bind(null, accountId)} className="mt-3 flex gap-2">
          <input name="name" placeholder="Új pipeline neve..." className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
          <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">+ Létrehoz</button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Szakaszok ({activePipeline.name})</h2>
        <div className="space-y-1.5">
          {activePipeline.stages.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-1.5 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </span>
              <form
                action={(fd) => deleteStageAction(s.id, String(fd.get("moveTo")) || null)}
                className="flex items-center gap-1"
              >
                <select name="moveTo" className="rounded-md border border-zinc-300 px-1 py-0.5 text-xs">
                  <option value="">Törlés (kontaktok is)</option>
                  {activePipeline.stages
                    .filter((s2) => s2.id !== s.id)
                    .map((s2) => (
                      <option key={s2.id} value={s2.id}>
                        Áthelyez: {s2.name}
                      </option>
                    ))}
                </select>
                <button className="text-xs text-red-600 hover:underline">Törlés</button>
              </form>
            </div>
          ))}
        </div>
        <form action={addStageAction.bind(null, activePipeline.id)} className="mt-3 flex gap-2">
          <input name="name" placeholder="Új szakasz neve..." className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
          <input name="color" type="color" defaultValue="#6366f1" className="h-9 w-10 rounded-lg border border-zinc-300" />
          <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">+ Hozzáad</button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Egyéni mezők</h2>
        <div className="space-y-1.5">
          {activePipeline.customFieldDefs.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-1.5 text-sm">
              <span>
                {f.name} <span className="text-xs text-zinc-400">· {f.section}</span>
              </span>
              <div className="flex items-center gap-2">
                <Badge color="gray">{CUSTOM_FIELD_TYPES.find((t) => t.key === f.type)?.label}</Badge>
                <form action={deleteCustomFieldAction.bind(null, f.id)}>
                  <button className="text-xs text-red-600 hover:underline">Törlés</button>
                </form>
              </div>
            </div>
          ))}
        </div>
        <form action={addCustomFieldAction.bind(null, activePipeline.id)} className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input name="name" placeholder="Mező neve..." className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
            <select name="type" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
              {CUSTOM_FIELD_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="section" placeholder="Szakasz (form-szekció)" defaultValue="Általános" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
            <input name="options" placeholder="Opciók (vesszővel, SELECT-hez)" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
          </div>
          <button className="w-full rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">+ Mező hozzáadása</button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Webhookok</h2>
        <div className="space-y-2">
          {activePipeline.webhooks.map((w) => (
            <div key={w.id} className="rounded-lg border border-zinc-100 p-2 text-xs">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-zinc-700">{w.name}</span>
                <span className="flex gap-2">
                  <form action={regenerateWebhookAction.bind(null, w.id)}>
                    <button className="text-indigo-600 hover:underline">Újragenerálás</button>
                  </form>
                  <form action={deleteWebhookAction.bind(null, w.id)}>
                    <button className="text-red-600 hover:underline">Törlés</button>
                  </form>
                </span>
              </div>
              <code className="block truncate rounded bg-zinc-50 px-2 py-1 text-zinc-600">
                {origin}/api/webhook/crm/{w.token}
              </code>
            </div>
          ))}
        </div>
        <form action={createWebhookAction.bind(null, accountId)} className="mt-3 space-y-2">
          <input type="hidden" name="pipelineId" value={activePipeline.id} />
          <input name="name" placeholder="Webhook neve (pl. Facebook Lead Ads)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
          <select name="stageId" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required>
            {activePipeline.stages.map((s) => (
              <option key={s.id} value={s.id}>
                Cél szakasz: {s.name}
              </option>
            ))}
          </select>
          <button className="w-full rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">+ Webhook létrehozása</button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Egyéb beállítások</h2>
        <form action={updateCrmSettingsAction.bind(null, accountId)} className="space-y-3">
          <label className="block text-sm">
            Név formátum
            <select name="nameFormat" defaultValue={nameFormat} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
              <option value="HU">Magyar (Vezetéknév Keresztnév)</option>
              <option value="EN">Angol (First Last)</option>
            </select>
          </label>
          <label className="flex items-center justify-between text-sm">
            Hívás gomb telefonszámokon
            <input type="checkbox" name="callButtonEnabled" defaultChecked={callButtonEnabled} />
          </label>
          <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">Mentés</button>
        </form>

        <div className="mt-4 border-t border-zinc-100 pt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-zinc-400">Források</h3>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(sourceCounts).map(([source, count]) => (
              <Badge key={source} color="blue">
                {source}: {count}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">Csapat aktivitás (utolsó 200 esemény)</h2>
          <input
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            placeholder="Szűrés..."
            className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
          />
        </div>
        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {activity
            .filter((a) => `${a.actor?.name ?? ""} ${a.message}`.toLowerCase().includes(activityFilter.toLowerCase()))
            .map((a) => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-600">
                  {a.actor ? <span className="font-medium">{a.actor.name}: </span> : null}
                  {a.message}
                </span>
                <span className="whitespace-nowrap text-zinc-400">{formatDistanceToNow(a.createdAt, { locale: hu, addSuffix: true })}</span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
