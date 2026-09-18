"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui";
import { APPROVAL_STATUSES, labelFor } from "@/lib/enums";
import { bulkDecideApprovalsAction, decideApprovalAction, type ApprovalDecision } from "@/lib/actions/approval-actions";

export type ApprovalRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  fileUrl: string | null;
  accountName?: string;
  createdAt: string;
};

export function ApprovalQueue({ items, mode }: { items: ApprovalRow[]; mode: "staff" | "client" }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function bulk(decision: ApprovalDecision) {
    startTransition(async () => {
      await bulkDecideApprovalsAction(Array.from(selected), decision);
      setSelected(new Set());
    });
  }

  return (
    <div>
      {selected.size > 0 ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm">
          <span className="font-medium text-indigo-700">{selected.size} kijelölve</span>
          {mode === "staff" ? (
            <>
              <button onClick={() => bulk("SEND_TO_CLIENT")} className="rounded-md bg-indigo-600 px-2 py-1 text-xs text-white">
                Jóváhagyás → ügyfélnek
              </button>
              <button onClick={() => bulk("REQUEST_CHANGES")} className="rounded-md border border-indigo-300 px-2 py-1 text-xs text-indigo-700">
                Módosítást kérek
              </button>
            </>
          ) : (
            <>
              <button onClick={() => bulk("CLIENT_APPROVE")} className="rounded-md bg-emerald-600 px-2 py-1 text-xs text-white">
                Jóváhagyom
              </button>
              <button onClick={() => bulk("CLIENT_REJECT")} className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700">
                Módosítást kérek
              </button>
            </>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <label className="relative block aspect-[4/3] cursor-pointer bg-zinc-100">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
                className="absolute left-2 top-2 z-10 h-4 w-4"
              />
              {item.fileUrl ? (
                <Image src={item.fileUrl} alt={item.title} fill className="object-cover" unoptimized />
              ) : null}
            </label>
            <div className="p-2">
              <p className="truncate text-xs font-medium text-zinc-800">{item.title}</p>
              <div className="mt-1 flex items-center justify-between">
                {item.accountName ? <span className="text-[11px] text-zinc-400">{item.accountName}</span> : <span />}
                <Badge color={item.status === "APPROVED" ? "green" : item.status === "REJECTED" ? "red" : "amber"}>
                  {labelFor(APPROVAL_STATUSES, item.status)}
                </Badge>
              </div>
              <div className="mt-2 flex gap-1">
                {mode === "staff" && item.status === "PENDING_INTERNAL" ? (
                  <button
                    onClick={() => startTransition(() => decideApprovalAction(item.id, "SEND_TO_CLIENT"))}
                    className="flex-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] text-white"
                  >
                    Küldés ügyfélnek
                  </button>
                ) : null}
                {mode === "staff" && item.status === "DRAFT" ? (
                  <button
                    onClick={() => startTransition(() => decideApprovalAction(item.id, "RESUBMIT"))}
                    className="flex-1 rounded-md bg-zinc-800 px-2 py-1 text-[11px] text-white"
                  >
                    Vissza jóváhagyásra
                  </button>
                ) : null}
                {mode === "client" && item.status === "PENDING_CLIENT" ? (
                  <>
                    <button
                      onClick={() => startTransition(() => decideApprovalAction(item.id, "CLIENT_APPROVE"))}
                      className="flex-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] text-white"
                    >
                      Jóváhagyom
                    </button>
                    <button
                      onClick={() => startTransition(() => decideApprovalAction(item.id, "CLIENT_REJECT"))}
                      className="flex-1 rounded-md border border-red-300 px-2 py-1 text-[11px] text-red-700"
                    >
                      Módosítás
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 ? <p className="py-8 text-center text-sm text-zinc-400">Nincs elem ebben a nézetben</p> : null}
    </div>
  );
}
