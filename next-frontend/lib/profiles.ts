import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  avatar_image_path: string | null;
  created_at: string | null;
};

export async function ensureAndFetchCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return null;
  }

  const user = authData.user;

  // Extract username from email (part before @) as default name
  const defaultName = user.email ? user.email.split('@')[0] : "";
  
  const upsertPayload = {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? defaultName,
    email: user.email ?? "",
    avatar_image_path: user.user_metadata?.avatar_url ?? null,
  } as const;

  await supabase.from("profiles").upsert(upsertPayload, { onConflict: "id" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_image_path, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return (profile as Profile) ?? null;
}
