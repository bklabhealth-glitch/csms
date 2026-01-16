export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/items/:path*",
    "/suppliers/:path*",
    "/stock-in/:path*",
    "/stock-out/:path*",
    "/stock-balance/:path*",
    "/reports/:path*",
  ],
};
