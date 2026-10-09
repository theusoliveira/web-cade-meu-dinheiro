import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/client";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/server/rateLimit";

// Hash fixo usado quando o e-mail não existe, para que a resposta leve o
// mesmo tempo e não revele quais e-mails estão cadastrados.
const DUMMY_HASH = "$2a$12$adFfB7bjSux1wLdbwGKqg.vWznclFQR5wYKxB01.yNVQifvIE/X4a";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password || email.length > 254 || password.length > 128) return null;

        // 10 tentativas / 15 min por e-mail e 30 / 15 min por IP.
        const ip = clientIp(request.headers);
        const emailKey = `login:email:${email}`;
        if (!rateLimit(emailKey, 10, 15 * 60_000) || !rateLimit(`login:ip:${ip}`, 30, 15 * 60_000)) {
          return null;
        }

        const rows = await getDb()(
          `SELECT id, email, password, display_name, full_name
           FROM public.users
           WHERE email = $1
           LIMIT 1`,
          [email],
        );

        const user = rows[0];
        const valid = await bcrypt.compare(password, (user?.password as string) ?? DUMMY_HASH);
        if (!user || !valid) return null;

        resetRateLimit(emailKey);
        return {
          id: user.id as string,
          email: user.email as string,
          name: ((user.display_name ?? user.full_name) as string) || "",
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
});
