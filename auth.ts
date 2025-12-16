// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import { upsertAppUser } from "@/lib/upsertAppUser";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ✅ dev에서 host 관련 이슈 줄이기
  trustHost: true,
  debug: process.env.NODE_ENV === "development",

  // ✅ DB Adapter 안 쓸 거면 JWT 전략 고정
  session: { strategy: "jwt" },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account, profile }) {
      // provider 정보 저장 (최초 로그인 시 account 있음)
      if (account) {
        (token as any).provider = account.provider;
        (token as any).providerUserId = account.providerAccountId;
      }

      // 카카오 프로필 보강
      if (account?.provider === "kakao" && profile) {
        const p: any = profile;
        token.name =
          p?.properties?.nickname ??
          p?.kakao_account?.profile?.nickname ??
          token.name;

        token.picture =
          p?.properties?.profile_image ??
          p?.kakao_account?.profile?.profile_image_url ??
          token.picture;
      }

      // ✅ app_users upsert는 여기서 "best effort"로 (실패해도 로그인 유지)
      const provider = (token as any).provider as string | undefined;
      const providerUserId = (token as any).providerUserId as string | undefined;

      if (provider && providerUserId && !(token as any).appUserId) {
        try {
          const dbUser = await upsertAppUser({
            provider,
            providerUserId,
            nickname: (token.name as string) ?? null,
            email: (token.email as string) ?? null,
          });
          (token as any).appUserId = dbUser.id;
        } catch (e) {
          console.error("[auth] upsertAppUser failed (non-blocking):", e);
          // 여기서 return false 같은 거 절대 하지 않음
        }
      }
      console.log("[jwt] provider=", provider, "providerUserId=", providerUserId, "hasAppUserId=", Boolean((token as any).appUserId));
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.name = (token.name as string) ?? session.user.name ?? null;
        session.user.email = (token.email as string) ?? session.user.email ?? null;
        session.user.image = (token.picture as string) ?? session.user.image ?? null;
      }

      (session as any).provider = (token as any).provider ?? null;
      (session as any).providerUserId = (token as any).providerUserId ?? null;
      (session as any).appUserId = (token as any).appUserId ?? null;

      return session;
    },
  },
});
