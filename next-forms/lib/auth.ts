import Google from '@auth/core/providers/google';
import { UpstashRedisAdapter } from '@auth/upstash-redis-adapter';
import { Redis } from '@upstash/redis';
import NextAuth, { type NextAuthConfig } from 'next-auth';

import prisma from '@/lib/prisma';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

const authConfig: NextAuthConfig = {
  providers: [Google],
  adapter: UpstashRedisAdapter(redis),

  callbacks: {
    async signIn({ user }) {
      if (!user.id || !user.name) {
        return false;
      }
      const data = {
        authjsUserId: user.id,
        username: user.name,
      };

      try {
        await prisma.user.upsert({
          where: { authjsUserId: user.id },
          update: data,
          create: data,
        });
        return true;
      } catch (error) {
        console.error('callbacks.signIn Database error:', error);
        return false;
      }
    },

    async session({ session, user }) {
      if (!session.user || !user?.id) return session;

      try {
        const appUser = await prisma.user.findUnique({
          where: { authjsUserId: user.id },
          select: { userId: true },
        });

        if (appUser) {
          session.user.id = appUser.userId;
        } else {
          delete (session.user as { id?: string }).id;
        }
      } catch (error) {
        console.error('callbacks.session Database error:', error);
        delete (session.user as { id?: string }).id;
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);