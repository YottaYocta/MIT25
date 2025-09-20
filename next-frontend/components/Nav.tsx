"use client";

import Link from "next/link";
import Button from "./Button";
import { SettingsIcon } from "lucide-react";
import { LuLibrary } from "react-icons/lu";
import { MdOutlinePublic } from "react-icons/md";
import { NavUpload } from "./NavUpload";

export const Nav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 w-full z-50">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2862 90"
        fill="none"
        className="h-20 fixed bottom-0 left-0 right-0 w-full -z-10"
        preserveAspectRatio="none"
      >
        <path
          d="M0 25.4997V89H2862V25.4997H0Z"
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

      {/* Left side - Settings (hidden on mobile; shown on sm+) */}
      <div className="absolute left-4 bottom-2 hidden sm:flex items-end h-16">
        <Link href="/settings">
          <Button className="w-11 h-11 rounded-full flex items-center justify-center bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/30 p-0">
            <SettingsIcon className="h-7 w-7 text-gray-600" />
          </Button>
        </Link>
      </div>

      {/* Center navigation - absolutely centered (desktop/tablet) */}
      <div className="absolute left-1/2 bottom-2 transform -translate-x-1/2 hidden sm:flex gap-2 items-end h-16">
        <Link href={"/private"}>
          <Button className="h-8 w-32 justify-center">My Trinkets</Button>
        </Link>
        <NavUpload />
        <Link href={"/public"}>
          <Button className="h-8 w-32 justify-center">Public</Button>
        </Link>
      </div>

      {/* Mobile layout: 35% | 30% | 35% grid with centered + button */}
      <div className="absolute inset-x-4 bottom-2 sm:hidden">
        <div className="grid grid-cols-[35%_30%_35%] items-center w-full">
          {/* Left column: settings + library */}
          <div className="flex items-center gap-3 justify-start">
            <Link href={"/settings"}>
              <Button className="w-11 h-11 rounded-full flex items-center justify-center p-0 bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/30">
                <SettingsIcon className="h-7 w-7" />
              </Button>
            </Link>
            <Link href={"/private"}>
              <Button className="w-11 h-11 rounded-full flex items-center justify-center p-0 bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/30">
                <LuLibrary className="h-6 w-6" />
              </Button>
            </Link>
          </div>
          {/* Center column: upload, fill column and centered */}
          <div className="flex items-center justify-center">
            <NavUpload className="w-full h-12" />
          </div>
          {/* Right column: public icon aligned to end */}
          <div className="flex items-center justify-end">
            <Link href={"/public"}>
              <Button className="w-11 h-11 rounded-full flex items-center justify-center p-0 bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/30">
                <MdOutlinePublic className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
