// @/next-frontend/app/page.tsx
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";
import { ensureAndFetchCurrentProfile } from "@/lib/profiles";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { RecentTrinkets } from "@/components/RecentTrinkets";
import { Collections } from "@/components/Collections";
import { Albert_Sans } from "next/font/google";

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const user = !error ? data?.claims : null;

  const profile = await ensureAndFetchCurrentProfile();

  if (!user || !profile) {
    return (
      <main className="min-h-svh flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className={`text-2xl font-semibold ${albertSans.className}`}>
              Sign in to Trinket
            </h1>
            <p className="text-sm text-muted-foreground">
              We will email you a magic link
            </p>
          </div>
          <LoginForm />
        </div>
      </main>
    );
  }

  return (
    <main className="h-dvh flex flex-col items-center justify-start p-6 overflow-x-clip">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div>
          <h2 className={`font-bold text-lg ${albertSans.className}`}>
            My Collections
          </h2>
          <Collections user={profile} />
        </div>

        <div>
          <h2 className={`font-bold text-lg ${albertSans.className}`}>
            Recent Trinkets
          </h2>
          <RecentTrinkets user={profile} />
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Trinket</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="text-sm underline underline-offset-4"
            >
              Upload image
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
    </main>
  );
}
