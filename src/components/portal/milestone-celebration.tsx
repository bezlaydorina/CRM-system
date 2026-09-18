"use client";

import { useEffect, useState } from "react";

export function MilestoneCelebration({ accountId }: { accountId: string }) {
  const [show, setShow] = useState(false);
  const key = `synk_milestone_ads_live_${accountId}`;

  useEffect(() => {
    try {
      if (!localStorage.getItem(key)) {
        // localStorage is only available client-side, so this one-time
        // "have we shown it" check can only happen inside an effect.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShow(true);
        localStorage.setItem(key, "1");
      }
    } catch {
      // localStorage unavailable (private mode etc.) - skip the celebration silently
    }
  }, [key]);

  if (!show) return null;

  const pieces = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShow(false)}>
      <div className="relative overflow-hidden rounded-2xl bg-white p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {pieces.map((i) => (
            <span
              key={i}
              className="absolute top-0 h-2 w-2 rounded-sm"
              style={{
                left: `${(i * 41) % 100}%`,
                backgroundColor: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899"][i % 4],
                animation: `synk-confetti 1.4s ease-in ${i * 0.04}s forwards`,
              }}
            />
          ))}
        </div>
        <p className="text-3xl">🎉</p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900">Elindultak a hirdetéseid!</h2>
        <p className="mt-1 text-sm text-zinc-500">Mostantól élőben követheted a teljesítményt itt a kezdőlapon.</p>
        <button
          onClick={() => setShow(false)}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Szuper!
        </button>
      </div>
      <style>{`
        @keyframes synk-confetti {
          from { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          to { transform: translateY(260px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
