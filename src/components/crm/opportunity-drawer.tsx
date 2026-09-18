"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";
import { Badge } from "@/components/ui";
import { CUSTOM_FIELD_TYPES } from "@/lib/enums";
import {
  getOpportunityDetail,
  updateOpportunityAction,
  addNoteAction,
  addTaskReminderAction,
  toggleTaskReminderAction,
  type OpportunityDetail,
} from "@/lib/actions/crm-actions";

type Tab = "details" | "notes" | "tasks" | "activity";

export function OpportunityDrawer({ opportunityId, onClose }: { opportunityId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<OpportunityDetail | null>(null);
  const [tab, setTab] = useState<Tab>("details");
  const [, startTransition] = useTransition();

  const reload = () => {
    getOpportunityDetail(opportunityId).then((d) => setDetail(d));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {!detail ? (
          <p className="p-6 text-sm text-zinc-400">Betöltés...</p>
        ) : (
          <div>
            <div className="flex items-start justify-between border-b border-zinc-100 p-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  {detail.firstName} {detail.lastName}
                </h2>
                <p className="text-xs text-zinc-500">{detail.opportunityName}</p>
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
                ✕
              </button>
            </div>

            <div className="flex gap-1 border-b border-zinc-100 px-4 pt-2 text-sm">
              {(
                [
                  ["details", "Opportunity Details"],
                  ["notes", "Jegyzetek"],
                  ["tasks", "Tennivalók"],
                  ["activity", "Aktivitás napló"],
                ] as [Tab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`-mb-px border-b-2 px-2 py-2 font-medium ${
                    tab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {tab === "details" ? (
                <form
                  action={(fd) =>
                    startTransition(async () => {
                      await updateOpportunityAction(opportunityId, fd);
                      reload();
                    })
                  }
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <TextField name="firstName" label="Keresztnév" defaultValue={detail.firstName} />
                    <TextField name="lastName" label="Vezetéknév" defaultValue={detail.lastName ?? ""} />
                    <TextField name="email" label="Email" defaultValue={detail.email ?? ""} />
                    <TextField name="phone" label="Telefon" defaultValue={detail.phone ?? ""} />
                    <TextField name="company" label="Cég" defaultValue={detail.company ?? ""} />
                    <TextField name="source" label="Forrás" defaultValue={detail.source ?? ""} />
                  </div>
                  <TextField name="opportunityName" label="Opportunity név" defaultValue={detail.opportunityName} />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs font-medium text-zinc-600">
                      Státusz
                      <select name="status" defaultValue={detail.status} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
                        <option value="OPEN">Nyitott</option>
                        <option value="WON">Megnyert</option>
                        <option value="LOST">Elveszett</option>
                      </select>
                    </label>
                    <TextField name="value" label="Érték (Ft)" type="number" defaultValue={String(detail.value)} />
                  </div>

                  {detail.stage.pipeline.customFieldDefs.length > 0 ? (
                    <div className="mt-3 border-t border-zinc-100 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-zinc-400">Egyéni mezők</p>
                      <div className="space-y-2">
                        {detail.stage.pipeline.customFieldDefs.map((f) => (
                          <CustomFieldInput key={f.id} field={f} value={detail.customFieldsParsed[f.id]} />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <button type="submit" className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
                    Mentés
                  </button>
                </form>
              ) : null}

              {tab === "notes" ? (
                <div className="space-y-3">
                  <form
                    action={(fd) =>
                      startTransition(async () => {
                        await addNoteAction(opportunityId, fd);
                        reload();
                      })
                    }
                    className="flex gap-2"
                  >
                    <input name="body" placeholder="Új jegyzet..." className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm" required />
                    <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">Mentés</button>
                  </form>
                  <div className="space-y-2">
                    {detail.notes.map((n) => (
                      <div key={n.id} className="rounded-lg border border-zinc-100 p-2 text-sm">
                        <p className="text-zinc-700">{n.body}</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {n.author?.name ?? "—"} · {formatDistanceToNow(n.createdAt, { locale: hu, addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {tab === "tasks" ? (
                <div className="space-y-3">
                  <form
                    action={(fd) =>
                      startTransition(async () => {
                        await addTaskReminderAction(opportunityId, fd);
                        reload();
                      })
                    }
                    className="space-y-2"
                  >
                    <input name="title" placeholder="Tennivaló címe..." className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm" required />
                    <div className="flex gap-2">
                      <select name="duePreset" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs">
                        <option value="today">Ma</option>
                        <option value="tomorrow">Holnap</option>
                        <option value="week">+1 hét</option>
                        <option value="month">+1 hónap</option>
                      </select>
                      <select name="assigneeId" className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs">
                        <option value="">Felelős...</option>
                        {detail.teamMembers.map((tm) => (
                          <option key={tm.id} value={tm.id}>
                            {tm.name}
                          </option>
                        ))}
                      </select>
                      <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">+ Hozzáad</button>
                    </div>
                  </form>
                  <div className="space-y-2">
                    {detail.taskReminders.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-2 text-sm">
                        <input
                          type="checkbox"
                          defaultChecked={t.done}
                          onChange={() =>
                            startTransition(async () => {
                              await toggleTaskReminderAction(t.id);
                              reload();
                            })
                          }
                        />
                        <span className={t.done ? "text-zinc-400 line-through" : "text-zinc-700"}>{t.title}</span>
                        <span className="ml-auto text-xs text-zinc-400">{new Date(t.dueAt).toLocaleDateString("hu-HU")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {tab === "activity" ? (
                <div className="space-y-2">
                  {detail.activityEntries.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <p className="text-zinc-700">
                        {a.actor ? <span className="font-medium">{a.actor.name}: </span> : null}
                        {a.message}
                      </p>
                      <Badge color="gray">{formatDistanceToNow(a.createdAt, { locale: hu, addSuffix: true })}</Badge>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <label className="text-xs font-medium text-zinc-600">
      {label}
      <input name={name} type={type} defaultValue={defaultValue} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
    </label>
  );
}

function CustomFieldInput({
  field,
  value,
}: {
  field: { id: string; name: string; type: string; options: string };
  value: unknown;
}) {
  const name = `cf_${field.id}`;
  const options: string[] = JSON.parse(field.options || "[]");

  if (field.type === "CHECKBOX") {
    return (
      <label className="flex items-center gap-2 text-xs text-zinc-600">
        <input type="checkbox" name={name} defaultChecked={!!value} /> {field.name}
      </label>
    );
  }
  if (field.type === "SELECT" || field.type === "MULTISELECT") {
    return (
      <label className="block text-xs font-medium text-zinc-600">
        {field.name} <span className="text-zinc-400">({CUSTOM_FIELD_TYPES.find((t) => t.key === field.type)?.label})</span>
        <select name={name} defaultValue={typeof value === "string" ? value : ""} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
          <option value="">—</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (field.type === "LONG_TEXT") {
    return (
      <label className="block text-xs font-medium text-zinc-600">
        {field.name}
        <textarea name={name} defaultValue={typeof value === "string" ? value : ""} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" rows={2} />
      </label>
    );
  }
  return (
    <label className="block text-xs font-medium text-zinc-600">
      {field.name}
      <input
        name={name}
        type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
        defaultValue={value != null ? String(value) : ""}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
      />
    </label>
  );
}
