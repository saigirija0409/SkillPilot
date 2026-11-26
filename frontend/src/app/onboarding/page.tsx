import { ProtectedPageShell } from "@/components/layout/ProtectedShell";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <ProtectedPageShell
      loginRedirect="/login?next=/onboarding"
      renderContent={({ userId }) => <OnboardingWizard userId={userId} />}
    />
  );
}
