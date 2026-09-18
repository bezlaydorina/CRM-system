import { PageHeader } from "@/components/ui";
import { AssistantChat } from "@/components/portal/assistant-chat";

export default function AssistantPage() {
  return (
    <div>
      <PageHeader title="Synk AI asszisztens" subtitle="A saját adataidra (kampányok, riportok, leadek) válaszol" />
      <AssistantChat />
    </div>
  );
}
