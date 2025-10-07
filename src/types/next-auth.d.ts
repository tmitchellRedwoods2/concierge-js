/**
 * NextAuth type extensions
 */
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      plan: string;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    plan: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    plan: string;
  }
}

