// @/next-frontend/app/page.tsx
import { createClient } from "@/lib/supabase/server";
import { RecentTrinkets } from "@/components/RecentTrinkets";
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

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="h-dvh flex flex-col items-center justify-center p-6 pb-24 overflow-x-clip">
      <div className="w-full flex flex-col gap-6">
        <div className="text-center bg-gray-500/20 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl w-full">
          <h2 className={`font-bold text-2xl ${albertSans.className} mb-6`}>
            My Trinkets
          </h2>
          <RecentTrinkets filterType="private" />
        </div>
      </div>
    </main>
  );
}
