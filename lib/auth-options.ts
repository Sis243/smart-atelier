import "server-only";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          const email = String(credentials?.email ?? "").trim().toLowerCase();
          const password = String(credentials?.password ?? "").trim();

          if (!email || !password) return null;

          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: "insensitive",
              },
            },
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              isActive: true,
              passwordHash: true,
            },
          });

          if (!user || !user.isActive || !user.passwordHash) return null;

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
          } as any;
        } catch (e) {
          console.error("[AUTH authorize]", e);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).role = (user as any).role;
        (token as any).name = (user as any).name;
        (token as any).email = (user as any).email;
      }
      return token;
    },

    async session({ session, token }) {
      (session as any).user = (session as any).user ?? {};
      (session as any).user.id = (token as any).id;
      (session as any).user.role = (token as any).role;
      (session as any).user.name = (token as any).name;
      (session as any).user.email = (token as any).email;
      return session;
    },
  },
};