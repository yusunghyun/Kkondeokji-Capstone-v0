"use client";

import { supabase } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  email: string;
};

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

export async function signOut() {
  const { error: refreshError } = await supabase.auth.refreshSession();
  const { error } = await supabase.auth.signOut();

  if (refreshError) {
    throw new Error(refreshError.message);
  }

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();

  console.log("getCurrentUser from supabase.auth.getSession", data);

  if (!data.session) {
    return null;
  }

  return {
    id: data.session.user.id,
    email: data.session.user.email || "",
  };
}
