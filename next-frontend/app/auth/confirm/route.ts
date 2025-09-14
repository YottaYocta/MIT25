import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/public";

  console.log("Auth confirm called with params:", {
    code: code ? "present" : "missing",
    token_hash: token_hash ? "present" : "missing", 
    type,
    next
  });

  // New flow: exchange an auth code for a session
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log("Successfully exchanged code for session, redirecting to:", next);
      redirect(next);
    } else {
      console.error("Error exchanging code for session:", error);
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Legacy flow: verify OTP using token_hash and type
  if (token_hash && type) {
    const supabase = await createClient();

    console.log("Using legacy OTP verification flow");
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      console.log("Successfully verified OTP, redirecting to:", next);
      redirect(next);
    } else {
      console.error("Error verifying OTP:", error);
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  console.log("No valid auth parameters found, redirecting to error");
  redirect(`/auth/error?error=No token hash or type`);
}
