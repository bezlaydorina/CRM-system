import { PageHeader, StubNotice } from "@/components/ui";

export default function StuckCreativesPage() {
  return (
    <div>
      <PageHeader title="Elakadt kreatívok" subtitle="Automatikus állapot-követő: Nincs szöveg / Szöveg ellenőrzés alatt / Domain hiányzik / Indításra kész" />
      <StubNotice feature="Elakadt kreatívok automata dashboard" />
    </div>
  );
}
