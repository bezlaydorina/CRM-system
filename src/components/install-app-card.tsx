"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

type ClientState = { ready: boolean; installed: boolean; ios: boolean };

export function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<ClientState>({ ready: false, installed: false, ios: false });
  const { ready, installed, ios } = state;

  useEffect(() => {
    // Mount-only read of browser-only APIs (matchMedia/userAgent); avoids a
    // server/client hydration mismatch by deferring until after first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ ready: true, installed: isStandalone(), ios: isIos() });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setState((prev) => ({ ...prev, installed: true }));
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (!ready) return null;

  if (installed) {
    return <p className="text-sm text-zinc-500">Az alkalmazás telepítve van erre az eszközre. ✅</p>;
  }

  if (deferredPrompt) {
    return (
      <div>
        <p className="mb-3 text-sm text-zinc-500">
          Telepítsd a The Code CRM-et appként, hogy gyorsabban elérd, és offline is megnyíljon.
        </p>
        <button
          onClick={async () => {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") setDeferredPrompt(null);
          }}
          className="rounded-lg bg-brand-gold px-3 py-1.5 text-sm font-semibold text-white"
        >
          Telepítés
        </button>
      </div>
    );
  }

  if (ios) {
    return (
      <div className="text-sm text-zinc-500">
        <p className="mb-2">Telepítsd appként iPhone-on/iPaden:</p>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Nyisd meg ezt az oldalt Safariban</li>
          <li>Koppints a Megosztás ikonra (□ nyíllal felfelé)</li>
          <li>Válaszd a &quot;Kezdőképernyőhöz adás&quot; lehetőséget</li>
        </ol>
      </div>
    );
  }

  return (
    <p className="text-sm text-zinc-500">
      A böngésződ jelenleg nem kínál közvetlen telepítési lehetőséget – próbáld meg a böngésző menüjéből
      (&quot;Alkalmazás telepítése&quot; / &quot;Hozzáadás a kezdőképernyőhöz&quot;).
    </p>
  );
}
