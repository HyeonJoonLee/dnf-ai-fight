//http://localhost:3000/api/auth/session <- auth 확인 방법 링크
// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";

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
    async jwt({ token, account, profile }) {
      // 로그인 "처음" 일어나는 시점에만 account가 들어오는 경우가 많아서 여기서 저장
      if (account) {
        (token as any).provider = account.provider;
        (token as any).providerUserId = account.providerAccountId; // ✅ 카카오 고유 id 포함
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

      return session;
    },
  },
});

