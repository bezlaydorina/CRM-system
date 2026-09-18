import { redirect } from "next/navigation";

export default async function AccountDetailIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/ugyfelek/${id}/attekintes`);
}
