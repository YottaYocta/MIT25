import { createClient } from "@/lib/supabase/server";
import { ensureAndFetchCurrentProfile } from "@/lib/profiles";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const user = !error ? data?.claims : null;

  const profile = await ensureAndFetchCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <SettingsForm profile={profile} />
      </div>
    </main>
  );
}
