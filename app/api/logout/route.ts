import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/app/lib/auth";

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.set({ name: AUTH_COOKIE, value: "", path: "/", maxAge: 0 });
  return res;
}
