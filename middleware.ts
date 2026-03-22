import { auth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/chat")) && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*"],
};
