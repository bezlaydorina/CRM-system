import { AccountCrmView } from "@/components/crm/account-crm-view";

export default async function AccountCrmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; pipeline?: string }>;
}) {
  const { id } = await params;
  const { view = "pipeline", pipeline } = await searchParams;
  return <AccountCrmView accountId={id} view={view} pipelineIdParam={pipeline} />;
}
