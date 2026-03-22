import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (!existing) {
            const now = new Date();
            const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split("@")[0],
                avatar: user.image || null,
                plan: "free_trial",
                trialEndsAt,
              },
            });
            user.id = newUser.id;
          } else {
            user.id = existing.id;
          }
        } catch (err) {
          console.error("signIn error:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      } else if (!token.userId && token.email) {
        // Backfill userId for sessions created before userId was stored in JWT
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: token.email as string } });
          if (dbUser) token.userId = dbUser.id;
        } catch { /* ignore DB errors */ }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
