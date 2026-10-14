import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { NewAccountForm } from "@/components/accounts/new-account-form";

export default function NewAccountPage() {
  return (
    <div>
      <div className="mb-4 flex items-start gap-3">
        <Link href="/admin/ugyfelek" className="mt-1 rounded-lg border border-zinc-300 p-2 text-zinc-500 hover:bg-zinc-50">
          ←
        </Link>
        <PageHeader title="Új ügyfél létrehozása" subtitle="Meeting közben? Használd a Gyorsmentést, a csomagot később is pótolhatod." />
      </div>

      <div className="mb-4 rounded-lg border border-brand-gold/15 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold-dark">
        <strong>Tipp:</strong> az új ügyfél form gépen kényelmesebb, de telefonon is kitöltheted, minden adat ugyanúgy mentődik.
      </div>

      <div className="max-w-4xl">
        <NewAccountForm />
      </div>
    </div>
  );
}
