import { EmployeeDashboardView } from "@/components/dashboard/EmployeeDashboardView";
import { ProtectedPageShell } from "@/components/layout/ProtectedShell";

export default function DashboardPage() {
  return (
    <ProtectedPageShell
      loginRedirect="/login?next=/dashboard"
      requireCompletedOnboarding
      renderContent={({ userId }) => <EmployeeDashboardView userId={userId} />}
    />
  );
}
