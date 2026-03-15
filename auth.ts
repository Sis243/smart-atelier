import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        // bloque si désactivé
        if (!user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // IMPORTANT: retourner un objet "user" minimal
        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // au login, on injecte role + isActive + id
      if (user) {
        token.uid = (user as any).id;
        token.role = (user as any).role;
        token.isActive = (user as any).isActive;
        token.name = (user as any).name;
        token.email = (user as any).email;
      }
      return token;
    },
    async session({ session, token }) {
      // exposer au front
      (session.user as any).id = token.uid;
      (session.user as any).role = token.role;
      (session.user as any).isActive = token.isActive;
      return session;
    },
  },
});
