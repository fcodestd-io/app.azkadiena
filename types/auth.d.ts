import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Role } from "../db/schema";

declare module "next-auth" {
  interface User {
    role?: Role;
  }

  interface Session {
    user: {
      id?: string;
      role?: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
