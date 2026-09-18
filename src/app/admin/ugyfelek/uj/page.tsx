import { PageHeader, Card } from "@/components/ui";
import { createAccountAction } from "@/lib/actions/account-actions";

export default function NewAccountPage() {
  return (
    <div>
      <PageHeader title="Új ügyfél" subtitle="Alap adatok megadása – a CRM pipeline és az onboarding feladat automatikusan létrejön" />
      <Card className="max-w-lg">
        <form action={createAccountAction} className="flex flex-col gap-3">
          <Field label="Cégnév *" name="name" required />
          <Field label="Weboldal" name="website" placeholder="https://..." />
          <Field label="Iparág" name="industry" />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Havi díj (Ft)" name="monthlyFee" type="number" />
            <Field label="Setup díj (Ft)" name="setupFee" type="number" />
            <Field label="Havi hird. keret (Ft)" name="monthlyAdBudget" type="number" />
          </div>
          <Field label="Forrás" name="source" placeholder="facebook_lead_ads, referral, ..." />
          <button type="submit" className="mt-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Ügyfél létrehozása
          </button>
        </form>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="text-sm font-medium text-zinc-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
    </label>
  );
}
