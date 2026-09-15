"use server";

import { signIn, signOut } from "../auth";
import { AuthError } from "next-auth";
import { z } from "zod";
import { loginSchema } from "./auth-schema";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export type LoginInput = z.infer<typeof loginSchema>;

export type ActionState = {
  errors?: {
    username?: string[];
    password?: string[];
  };
  message?: string | null;
} | null;

export async function loginAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const validated = loginSchema.safeParse(data);

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: null,
    };
  }

  // 1. Cari user di database untuk menentukan target redirect berdasarkan role
  const user = await db.query.users.findFirst({
    where: eq(users.username, validated.data.username),
  });

  // 2. Tentukan URL Redirect dinamis
  let redirectUrl = "/dashboard";
  if (user?.role === "spv_warehouse") {
    redirectUrl = "/supervisor/warehouse/dashboard";
  }

  try {
    await signIn("credentials", {
      username: validated.data.username,
      password: validated.data.password,
      redirectTo: redirectUrl,
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { errors: {}, message: "Username atau password salah!" };
        default:
          return { errors: {}, message: "Terjadi kesalahan pada sistem." };
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
