// @/next-frontend/app/page.tsx
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";
import { RecentTrinkets } from "@/components/RecentTrinkets";
import { Collections } from "@/components/Collections";
import { Albert_Sans } from "next/font/google";
import { ConditionalNav } from "@/components/ConditionalNav";

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const user = !error ? data?.claims : null;

  if (!user) {
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
          <Collections />
        </div>

        <div>
          <h2 className={`font-bold text-lg ${albertSans.className}`}>
            Recent Trinkets
          </h2>
          <RecentTrinkets />
        </div>
      </div>
      <ConditionalNav />
    </main>
  );
}
