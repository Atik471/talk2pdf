import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

interface Credentials {
  email: string;
  password: string;
}

const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials as Credentials;

        try {
          // Fetch user from Supabase
          const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

          if (error || !user) {
            console.error("Auth error or user not found:", error);
            return null;
          }

          const passwordMatch = await bcrypt.compare(password, user.password || "");
          if (!passwordMatch) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("email", user.email || "")
            .single();

          if (!existingUser) {
            const { error: createError } = await supabase
              .from("users")
              .insert([
                {
                  name: user.name,
                  email: user.email,
                  image: user.image,
                  password: "",
                },
              ]);

            if (createError) throw createError;
            console.log(`✅ ${account.provider} user saved to Supabase`);
          }
        } catch (error) {
          console.error(`Error saving ${account.provider} user to Supabase:`, error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", user.email || "")
          .single();

        if (dbUser) {
          token.id = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error - next-auth Session type doesn't include id by default
        session.user.id = token.id;
      }
      return session;
    }
  },

  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET!,
  pages: {
    signIn: "/",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
