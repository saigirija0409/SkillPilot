import { ProtectedPageShell } from "@/components/layout/ProtectedShell";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

export default function ProfilePage() {
  return (
    <ProtectedPageShell
      loginRedirect="/login?next=/profile"
      renderContent={({ userId }) => <ProfileEditor userId={userId} />}
    />
  );
}
