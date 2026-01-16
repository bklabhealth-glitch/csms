import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();

  // Delete all next-auth cookies
  cookieStore.delete("next-auth.session-token");
  cookieStore.delete("next-auth.csrf-token");
  cookieStore.delete("next-auth.callback-url");
  cookieStore.delete("__Secure-next-auth.session-token");
  cookieStore.delete("__Secure-next-auth.csrf-token");
  cookieStore.delete("__Secure-next-auth.callback-url");

  return NextResponse.json({
    success: true,
    message: "Cookies cleared successfully!"
  });
}
