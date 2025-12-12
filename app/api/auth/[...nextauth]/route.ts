// app/api/auth/[...nextauth]/route.ts
//http://localhost:3000/api/auth/session <- auth 확인 방법 링크

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
