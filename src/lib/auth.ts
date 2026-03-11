// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("👉 Login attempt for:", credentials?.email);
        
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing email or password");
            throw new Error("Missing email or password");
          }

          console.log("👉 Looking up user in database...");
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            console.log("❌ User not found in database");
            throw new Error("User not found");
          }

          if (!user.isActive) {
            console.log("❌ User is marked as inactive");
            throw new Error("User inactive");
          }

          console.log("👉 User found! Checking password...");
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log("❌ Invalid password");
            throw new Error("Invalid password");
          }

          console.log("✅ Login successful! Returning user session.");
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            branch: user.branch,
          };
        } catch (error) {
          console.error("🚨 AUTHENTICATION ERROR:", error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    // Inject the custom fields into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branch = user.branch;
      }
      return token;
    },
    // Pass the token fields to the client-side session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.branch = token.branch as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login", // We will build this page next
  },
  session: {
    strategy: "jwt",
  },
  // We need a secret to sign the tokens securely
  secret: process.env.NEXTAUTH_SECRET,
};