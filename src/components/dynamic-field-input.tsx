import { CUSTOM_FIELD_TYPES } from "@/lib/enums";

export type DynamicFieldDef = { id: string; name: string; type: string; options: string };

/**
 * Egy mező renderelése a JSON-alapú egyéni mező sémából - a mini-CRM
 * opportunity-szintű egyéni mezőivel (CustomFieldDefinition) és az
 * Értékesítési felvétel/Onboarding kérdőívvel (IntakeFormFieldDefinition)
 * közösen használt renderer.
 */
export function DynamicFieldInput({ field, value, namePrefix = "cf_" }: { field: DynamicFieldDef; value: unknown; namePrefix?: string }) {
  const name = `${namePrefix}${field.id}`;
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
