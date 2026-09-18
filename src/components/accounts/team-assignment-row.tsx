"use client";

import { useRef } from "react";
import { Avatar } from "@/components/ui";
import { setTeamAssignmentAction } from "@/lib/actions/account-actions";

export function TeamAssignmentRow({
  accountId,
  role,
  current,
  teamMembers,
}: {
  accountId: string;
  role: string;
  current?: { teamMemberId: string; teamMember: { name: string; avatarColor: string } };
  teamMembers: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={setTeamAssignmentAction.bind(null, accountId)} className="flex items-center justify-between gap-2">
      <input type="hidden" name="role" value={role} />
      <span className="flex items-center gap-2 text-xs text-zinc-500">
        {current ? <Avatar name={current.teamMember.name} color={current.teamMember.avatarColor} size={5} /> : null}
        {role}
      </span>
      <select
        name="teamMemberId"
        defaultValue={current?.teamMemberId ?? ""}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-zinc-300 px-1.5 py-1 text-xs"
      >
        <option value="">—</option>
        {teamMembers.map((tm) => (
          <option key={tm.id} value={tm.id}>
            {tm.name}
          </option>
        ))}
      </select>
    </form>
  );
}
