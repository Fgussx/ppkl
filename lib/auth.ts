import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/app";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,nama,role,created_at,updated_at")
    .eq("id", userId)
    .single();

  if (error) {
    return null;
  }

  return data as Profile;
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,nama,role,created_at,updated_at")
    .eq("id", user.id)
    .single();

  if (error || !data || data.role !== "admin") {
    redirect("/dashboard");
  }

  return { supabase, user, profile: data as Profile };
}
