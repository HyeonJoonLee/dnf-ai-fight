// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // 지금은 최소 설정만 — 나중에 여기서 Supabase에 app_users 연동 콜백 추가하면 됨
  secret: process.env.NEXTAUTH_SECRET,
});
