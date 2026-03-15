import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

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

          // ✅ IMPORTANT: findFirst + mode: "insensitive" (findUnique ne le supporte pas)
          const user = await prisma.user.findFirst({
            where: {
              email: { equals: email, mode: "insensitive" },
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

          if (!user) return null;
          if (!user.isActive) return null;
          if (!user.passwordHash) return null;

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
          } as any;
        } catch (e) {
          console.error("❌ authorize() error:", e);
          // Si erreur Prisma/env, NextAuth renvoie CredentialsSignin (res.error)
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      // ✅ session.user peut être undefined parfois
      (session as any).user = (session as any).user ?? {};
      (session as any).user.id = token.id;
      (session as any).user.role = token.role;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
