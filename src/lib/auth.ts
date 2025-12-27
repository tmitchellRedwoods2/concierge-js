/**
 * NextAuth configuration
 * Handles authentication for Concierge.js
 */
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongodb";
import getUser from "@/lib/db/models/User";

// Auto-detect NEXTAUTH_URL for Vercel deployments
const getNextAuthUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // For Vercel deployments, use the VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback for local development
  return 'http://localhost:3000';
};

export const authOptions = {
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.log('❌ Auth: Missing credentials');
          return null;
        }

        try {
          await connectDB();
          
          const User = getUser();
          // Trim and normalize username for lookup
          const normalizedUsername = (credentials.username as string).trim();
          console.log(`🔍 Auth: Looking up user: "${normalizedUsername}"`);
          
          const user = await User.findOne({ 
            username: normalizedUsername 
          });
          
          if (!user) {
            // Try case-insensitive lookup
            const userCaseInsensitive = await User.findOne({ 
              username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') }
            });
            if (userCaseInsensitive) {
              console.log(`✅ Auth: Found user with case-insensitive match: ${userCaseInsensitive.username}`);
              // Use the found user
              const isPasswordValid = await bcrypt.compare(
                credentials.password as string,
                userCaseInsensitive.password
              );
              if (!isPasswordValid) {
                console.log('❌ Auth: Password mismatch');
                return null;
              }
              return {
                id: userCaseInsensitive._id.toString(),
                email: userCaseInsensitive.email,
                name: `${userCaseInsensitive.firstName} ${userCaseInsensitive.lastName}`,
                username: userCaseInsensitive.username,
                plan: userCaseInsensitive.plan,
                role: userCaseInsensitive.role,
                accessMode: userCaseInsensitive.accessMode,
              };
            }
            console.log(`❌ Auth: User not found: "${normalizedUsername}"`);
            return null;
          }

          console.log(`✅ Auth: User found: ${user.username} (${user.email})`);

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            console.log('❌ Auth: Password mismatch for user:', user.username);
            return null;
          }

          console.log(`✅ Auth: Password valid for user: ${user.username}`);

          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            username: user.username,
            plan: user.plan,
            role: user.role,
            accessMode: user.accessMode,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.plan = user.plan;
        token.role = user.role;
        token.accessMode = user.accessMode;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.plan = token.plan as string;
        session.user.role = token.role as string;
        session.user.accessMode = token.accessMode as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);

