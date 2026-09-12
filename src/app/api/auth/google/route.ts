import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = new URL(request.url).origin;

  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/?auth_error=missing_credentials", origin)
    );
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  const scope = encodeURIComponent("openid email profile");
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(googleAuthUrl);
}
