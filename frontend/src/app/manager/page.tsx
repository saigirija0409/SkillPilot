import { ManagerDashboardPlaceholder } from "@/components/dashboard/ManagerDashboardPlaceholder";
import { ProtectedPageShell } from "@/components/layout/ProtectedShell";

export default function ManagerPage() {
  return (
    <ProtectedPageShell
      loginRedirect="/login?next=/manager"
      renderContent={({ accountType, organizationId }) => (
        <ManagerDashboardPlaceholder
          accountType={accountType}
          organizationId={organizationId}
        />
      )}
    />
  );
}
