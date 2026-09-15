import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { users, Role } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { username, password } = validated.data;

        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
        });

        if (!user || !user.password) return null;

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) return null;

        return {
          id: user.id,
          name: user.username,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnSpvDashboard = nextUrl.pathname.startsWith(
        "/supervisor/warehouse/dashboard",
      );
      const isOnRoot = nextUrl.pathname === "/";

      // SPV tidak diperbolehkan masuk dashboard web admin, alihkan ke supervisor/warehouse/dashboard
      if (isLoggedIn && role === "spv_warehouse" && isOnDashboard) {
        return Response.redirect(
          new URL("/supervisor/warehouse/dashboard", nextUrl),
        );
      }

      // Proteksi akses ke supervisor/warehouse/dashboard
      if (isOnSpvDashboard) {
        if (
          isLoggedIn &&
          (role === "spv_warehouse" || role === "admin" || role === "owner")
        )
          return true;
        return false;
      }

      if (isOnDashboard) {
        if (isLoggedIn && (role === "admin" || role === "owner")) return true;
        return false; // Redirect ke login jika tidak ada session
      } else if (isOnRoot && isLoggedIn) {
        if (role === "spv_warehouse") {
          return Response.redirect(
            new URL("/supervisor/warehouse/dashboard", nextUrl),
          );
        }
        if (role === "admin" || role === "owner") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/",
  },
});
