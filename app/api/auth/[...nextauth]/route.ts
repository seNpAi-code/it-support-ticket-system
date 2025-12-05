import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { supabaseAdmin } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;

            // Sync user to Supabase profiles
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('email', user.email)
                .single();

            if (error && error.code === 'PGRST116') {
                // User does not exist, create them
                const { error: insertError } = await supabaseAdmin
                    .from('profiles')
                    .insert([
                        {
                            email: user.email,
                            full_name: user.name || 'Unknown',
                            role: 'user', // Default role
                        },
                    ]);

                if (insertError) {
                    console.error('Error creating user profile:', insertError);
                    return false;
                }
            }

            return true;
        },
        async session({ session, token }) {
            if (session.user && session.user.email) {
                // Fetch role from Supabase
                const { data } = await supabaseAdmin
                    .from('profiles')
                    .select('role')
                    .eq('email', session.user.email)
                    .single();

                // Add role to session
                // @ts-ignore
                session.user.role = data?.role || 'user';
            }
            return session;
        },
        async jwt({ token, user }) {
            return token;
        }
    },
    pages: {
        signIn: '/auth/signin', // Custom sign-in page if needed, or default
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
