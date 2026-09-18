import { PageHeader, StubNotice } from "@/components/ui";

export default function AiCreativePage() {
  return (
    <div>
      <PageHeader title="AI Creative" subtitle="Chat-alapú AI kreatív-generátor, havi kvótával, CSM jóváhagyás sorba helyezéssel" />
      <StubNotice feature="AI Creative generátor (OpenAI/Anthropic image + copy API)" />
    </div>
  );
}
