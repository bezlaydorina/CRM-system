import { findValidAuthToken } from "@/lib/auth-tokens";
import { setPasswordViaTokenAction } from "@/lib/actions/auth-actions";

export default async function SetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const record = await findValidAuthToken(token);

  const name = record?.contact?.fullName ?? record?.teamMember?.name ?? null;

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-maroon to-brand-text px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold text-lg font-bold text-white">
            T
          </div>
          <h1 className="text-xl font-semibold text-brand-text">Jelszó beállítása</h1>
          <p className="mt-1 text-sm text-zinc-500">{name ? `Szia, ${name}!` : "The Code"}</p>
        </div>

        {!record ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Ez a link lejárt vagy már felhasználták. Kérj újat attól, aki meghívott.
          </p>
        ) : (
          <>
            {error ? (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                A két jelszó nem egyezik, vagy túl rövid (min. 4 karakter).
              </p>
            ) : null}
            <form action={setPasswordViaTokenAction.bind(null, token)} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-zinc-700">
                Új jelszó
                <input
                  name="password"
                  type="password"
                  required
                  minLength={4}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Jelszó megerősítése
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={4}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="mt-2 rounded-lg bg-brand-gold px-3 py-2 text-sm font-semibold text-white hover:bg-brand-gold-dark"
              >
                Jelszó mentése és belépés
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
