"use client";

import Link from "next/link";
import Button from "./Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PlusIcon, LogOutIcon } from "lucide-react";

export const Nav = () => {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };
  return (
    <div className="fixed flex justify-between items-end bottom-0 left-0 h-20 py-2 w-screen px-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2862 90"
        fill="none"
        className="h-20 fixed bottom-0 -z-10"
      >
        <path
          d="M1 25.4997V88.9996H2861V25.4997H1480C1470.5 25.4997 1476.25 1.00023 1460 1.00002H1402C1385.75 0.999986 1392.5 25.4997 1380 25.4997H1Z"
          fill="url(#paint0_linear_131_15)"
          stroke="#DEE4FF"
        />
        <defs>
          <linearGradient
            id="paint0_linear_131_15"
            x1="1431"
            y1="1"
            x2="1431"
            y2="88.9996"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="#E9ECFF" />
          </linearGradient>
        </defs>
      </svg>

      {/* Left spacer to balance layout */}
      <div className="w-16"></div>

      {/* Center navigation */}
      <div className="flex gap-2 items-end">
        <Link href={"/private"}>
          <Button className="h-8 w-32 justify-center">My Trinkets</Button>
        </Link>
        <Link href={"/upload"}>
          <Button className="w-16 h-16 rounded-full flex items-center justify-center">
            <PlusIcon></PlusIcon>
          </Button>
        </Link>
        <Link href={"/public"}>
          <Button className="h-8 w-32 justify-center">Public</Button>
        </Link>
      </div>

      {/* Right logout button */}
      <div className="flex items-end">
        <Button 
          className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 border-red-500/30"
          handleClick={handleLogout}
        >
          <LogOutIcon className="h-5 w-5 text-red-600" />
        </Button>
      </div>
    </div>
  );
};
