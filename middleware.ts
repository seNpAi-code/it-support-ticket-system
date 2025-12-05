import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
        const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

        if (isAuthPage) {
            if (isAuth) {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
            return null;
        }

        if (!isAuth) {
            let from = req.nextUrl.pathname;
            if (req.nextUrl.search) {
                from += req.nextUrl.search;
            }
            return NextResponse.redirect(
                new URL(`/api/auth/signin?callbackUrl=${encodeURIComponent(from)}`, req.url)
            );
        }

        if (isAdminPage) {
            // @ts-ignore
            if (token?.role !== "admin") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
        }

        return null;
    },
    {
        callbacks: {
            async authorized() {
                // This is a work-around for handling redirect on auth pages.
                // We return true here so the middleware function above can handle the logic.
                return true;
            },
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/tickets/:path*"],
};
