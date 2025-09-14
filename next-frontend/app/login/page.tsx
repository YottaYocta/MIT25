// @/next-frontend/app/page.tsx
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";
import { ensureAndFetchCurrentProfile } from "@/lib/profiles";
import { Albert_Sans } from "next/font/google";
import { redirect } from "next/navigation";

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
  redirect("/private");
}
