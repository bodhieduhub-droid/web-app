import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireDashboardContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireDashboardContext();
  return <DashboardLayout role={context.normalizedRole}>{children}</DashboardLayout>;
}
