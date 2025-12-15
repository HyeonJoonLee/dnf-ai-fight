//http://localhost:3000/api/auth/session <- auth 확인 방법 링크
// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import { upsertAppUser } from "@/lib/upsertAppUser";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  // 지금은 최소 설정만 — 나중에 여기서 Supabase에 app_users 연동 콜백 추가하면 됨
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // 로그인 성공 시 DB upsert
    async signIn({ user, account, profile }) {
      if (!account?.provider || !account.providerAccountId) return false;

      // 카카오는 user.name이 비어 있을 때가 있어서 profile에서 보강
      let nickname = user?.name ?? null;
      if (account.provider === "kakao" && profile) {
        const p: any = profile;
        nickname =
          p?.properties?.nickname ??
          p?.kakao_account?.profile?.nickname ??
          nickname;
      }
      try {
        const dbUser = await upsertAppUser({
          provider: account.provider,
          providerUserId: account.providerAccountId,
          nickname,
          email: user?.email ?? null,
        });

        // 🔥 (선택) jwt에서 token에 심을 수 있게 임시로 account에 실어둠
        // 타입이 빡빡하면 (account as any)로 처리
        (account as any).appUserId = dbUser.id;

        return true;
      } catch (e) {
        console.error("[auth] upsertAppUser failed:", e);
        return false; // upsert 실패하면 로그인 자체를 막아버리는 게 운영상 안전
      }
    },

    async jwt({ token, account, profile }) {
      // 로그인 "처음" 일어나는 시점에만 account가 들어오는 경우가 많아서 여기서 저장
      if (account) {
        (token as any).provider = account.provider;
        (token as any).providerUserId = account.providerAccountId; // ✅ 카카오 고유 id 포함

        // ✅ (선택) signIn에서 넣어둔 appUserId를 token에 저장
        if ((account as any).appUserId) {
          (token as any).appUserId = (account as any).appUserId;
        }
      }

      // 카카오 프로필 → name/image 채우기
      if (account?.provider === "kakao" && profile) {
        const p: any = profile;
        token.name =
          p?.properties?.nickname ?? p?.kakao_account?.profile?.nickname ?? token.name;
        token.picture =
          p?.properties?.profile_image ??
          p?.kakao_account?.profile?.profile_image_url ??
          token.picture;
      }

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

      // ✅ (선택) 내부 userId를 세션에 노출 (이게 있으면 이후 캐릭터 테이블 user_id 매핑이 쉬움)
      (session as any).appUserId = (token as any).appUserId ?? null;

      return session;
    },
  },
});

