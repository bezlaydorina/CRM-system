import { getEffectiveAccountId } from "@/lib/auth";
import { AccountCrmView } from "@/components/crm/account-crm-view";

export default async function PortalCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; pipeline?: string }>;
}) {
  const accountId = (await getEffectiveAccountId())!;
  const { view = "pipeline", pipeline } = await searchParams;
  return <AccountCrmView accountId={accountId} view={view} pipelineIdParam={pipeline} />;
}
