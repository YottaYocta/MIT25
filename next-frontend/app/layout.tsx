import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Button from "@/components/Button";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Trinket",
  description: "Collect your world.",
};

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {children}

        <div className="fixed flex justify-center items-end gap-2 bottom-0 left-0 h-20 py-2 w-screen">
          <svg
            viewBox="0 0 462 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-screen h-auto fixed bottom-0 -z-10"
          >
            <path
              d="M1 25.4997V88.9996H461V25.4997H280C270.5 25.4997 276.254 1.00023 260 1.00003H202C185.746 0.999987 192.5 25.4997 180 25.4997H1Z"
              fill="url(#paint0_linear_131_15)"
              stroke="#DEE4FF"
            />
            <defs>
              <linearGradient
                id="paint0_linear_131_15"
                x1="231"
                y1="1"
                x2="231"
                y2="88.9996"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="white" />
                <stop offset="1" stop-color="#E9ECFF" />
              </linearGradient>
            </defs>
          </svg>

          <Link href={"/"}>
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
      </body>
    </html>
  );
}
