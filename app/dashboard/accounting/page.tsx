import ModuleGuard from "@/components/ModuleGuard";
import AccountingDashboardClient from "./AccountingDashboardClient";

export default function AccountingPage() {
  return (
    <ModuleGuard moduleKey="accounting">
      <AccountingDashboardClient />
    </ModuleGuard>
  );
}
