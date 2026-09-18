"use client";

import { useState, useTransition } from "react";
import { askAssistantAction } from "@/lib/actions/assistant-actions";

const SUGGESTIONS = ["Hogy mennek most a hirdetéseim?", "Melyik kampány hozza most a legtöbbet?", "Adj egy landing page tippet ami tényleg működik"];

type ChatMessage = { role: "user" | "assistant"; text: string };

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Szia! Kérdezz bármit a saját kampányaidról, riportjaidról vagy leadjeidről." },
  ]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  function ask(question: string) {
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    startTransition(async () => {
      const answer = await askAssistantAction(question);
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
    });
  }

  return (
    <div className="flex h-[65vh] flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-md rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-800"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {pending ? <p className="text-xs text-zinc-400">Synk AI gondolkozik...</p> : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-100">
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Kérdezz valamit..."
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Küldés</button>
      </form>
    </div>
  );
}
