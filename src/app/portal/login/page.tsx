import Link from "next/link";
import { clientLoginAction } from "@/lib/actions/auth-actions";

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
            S
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Ügyfélportál</h1>
          <p className="mt-1 text-sm text-zinc-500">Jelentkezz be a saját fiókodba</p>
        </div>
        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Hibás email vagy jelszó.
          </p>
        ) : null}
        <form action={clientLoginAction} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-zinc-700">
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue="kapcsolat@zoldkert.hu"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Jelszó
            <input
              name="password"
              type="password"
              required
              defaultValue="ugyfel123"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Bejelentkezés
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-zinc-400">
          Synk AI csapattag vagy? <Link href="/login" className="text-emerald-600 hover:underline">Belső bejelentkezés</Link>
        </p>
      </div>
    </div>
  );
}
