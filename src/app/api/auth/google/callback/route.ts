import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = new URL(request.url).origin;

  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?auth=fallback", origin));
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(new URL("/?auth_error=token_failed", origin));
    }

    // 2. Fetch Google profile
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      return NextResponse.redirect(
        new URL("/?auth_error=profile_failed", origin)
      );
    }

    // 3. Prepare response with session cookie and user data
    const user = {
      id: profile.id || `usr_${Date.now()}`,
      name: profile.name || profile.email.split("@")[0],
      email: profile.email,
      picture: profile.picture,
      plan: "Pro",
    };

    const redirectResponse = NextResponse.redirect(
      new URL(`/?auth_user=${encodeURIComponent(JSON.stringify(user))}`, origin)
    );

    redirectResponse.cookies.set("jarvis_session", JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return redirectResponse;
  } catch {
    return NextResponse.redirect(new URL("/?auth_error=server_error", origin));
  }
}
