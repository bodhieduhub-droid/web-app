import MainLayout from "@/components/layout/main-layout";
import { requireDashboardContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireDashboardContext();
  return <MainLayout role={context.normalizedRole}>{children}</MainLayout>;
}
