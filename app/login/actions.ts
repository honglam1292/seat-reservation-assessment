"use server";

import { redirect } from "next/navigation";
import { loginWithPassword } from "@/services/authService";
import { getServiceErrorMessage } from "@/services/errors";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(formData: FormData) {
  try {
    await loginWithPassword(
      getString(formData, "email"),
      getString(formData, "password")
    );
  } catch (error) {
    redirect(`/login?error=${encodeURIComponent(getServiceErrorMessage(error))}`);
  }

  redirect("/");
}
