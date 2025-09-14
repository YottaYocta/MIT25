"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { FaXTwitter } from "react-icons/fa6";
import { FiMessageCircle } from "react-icons/fi";

type FloatingShareButtonProps = {
  className?: string;
  title?: string;
  text?: string;
  url?: string;
};

export default function FloatingShareButton(props: FloatingShareButtonProps) {
  const { className, title, text, url } = props;

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return url || "";
    return url || window.location.href;
  }, [url]);

  const shareTitle = title || "Trinket";
  const shareText = text || "Just trinkitized this -- check it out";

  const xHref = useMemo(() => {
    const u = new URL("https://twitter.com/intent/tweet");
    u.searchParams.set("text", shareText);
    if (shareUrl) u.searchParams.set("url", shareUrl);
    return u.toString();
  }, [shareText, shareUrl]);

  const smsHref = useMemo(() => {
    const body = encodeURIComponent(`${shareText}${shareUrl ? " " + shareUrl : ""}`);
    return `sms:&body=${body}`;
  }, [shareText, shareUrl]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-40",
        className
      )}
      aria-hidden="true"
    >
      <div className="pointer-events-auto absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col gap-2">
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share to X"
          className={cn(
            "group flex h-10 w-10 items-center justify-center rounded-full text-white shadow-2xl transition",
            "hover:shadow-[0_10px_25px_rgba(0,0,0,0.35)] active:translate-y-[1px]",
            "border border-white/20"
          )}
          style={{
            background: "linear-gradient(145deg, rgba(87, 83, 201, 0.55) 0%, rgba(87, 83, 201, 0.30) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          title={shareTitle}
        >
          <FaXTwitter className="h-5 w-5" />
        </a>

        <a
          href={smsHref}
          aria-label="Share via iMessage"
          className={cn(
            "group flex h-10 w-10 items-center justify-center rounded-full text-white shadow-2xl transition",
            "hover:shadow-[0_10px_25px_rgba(0,0,0,0.35)] active:translate-y-[1px]",
            "border border-white/20"
          )}
          style={{
            background: "linear-gradient(145deg, rgba(87, 83, 201, 0.55) 0%, rgba(87, 83, 201, 0.30) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          title={shareTitle}
        >
          <FiMessageCircle className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
