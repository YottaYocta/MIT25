// @/next-frontend/app/page.tsx
import { createClient } from "@/lib/supabase/server";
import { RecentTrinkets } from "@/components/RecentTrinkets";
import { Collections } from "@/components/Collections";
import { Albert_Sans } from "next/font/google";
import { ConditionalNav } from "@/components/ConditionalNav";
import Link from "next/link";
import Button from "@/components/Button";

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
      <main className="h-dvh flex flex-col items-center justify-start p-6 overflow-x-clip">
        <div className="w-full max-w-2xl flex flex-col gap-6">
          <div className="text-center mb-6">
            <h1 className={`text-3xl font-bold mb-2 ${albertSans.className}`}>
              Welcome to Trinket
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              See what others are trinketizing!
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/auth/login">
                <Button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-black border-blue-500">Make Some Trinkets!</Button>
              </Link>
            </div>
          </div>
          
          <div>
            <h2 className={`font-bold text-lg ${albertSans.className}`}>
              Public Trinkets
            </h2>
            <RecentTrinkets filterType="public" />
          </div>
        </div>
        <ConditionalNav />
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
          <RecentTrinkets filterType="public" />
        </div>
      </div>
      <ConditionalNav />
    </main>
  );
}
