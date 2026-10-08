import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/?error=google_auth_failed`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Token exchange failed");
    }

    // 2. Fetch user profile from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();

    if (!profile.email) {
      throw new Error("No email returned from Google profile");
    }

    const cleanEmail = profile.email.toLowerCase().trim();

    // 3. Upsert user in Supabase database
    const user = await prisma.$transaction(async (tx) => {
      let existing = await tx.user.findUnique({
        where: { email: cleanEmail },
        include: { subscription: true, creditBalance: true },
      });

      if (existing) {
        if (!existing.avatar && profile.picture) {
          existing = await tx.user.update({
            where: { id: existing.id },
            data: { avatar: profile.picture, name: profile.name || existing.name },
            include: { subscription: true, creditBalance: true },
          });
        }
        return existing;
      }

      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          name: profile.name || cleanEmail.split("@")[0],
          avatar: profile.picture,
          role: cleanEmail.includes("admin") ? "ADMIN" : "USER",
          subscription: {
            create: { plan: "FREE", status: "ACTIVE", priceAmount: 0 },
          },
          creditBalance: {
            create: { currentBalance: 50, dailyAllowance: 50, lastCreditRefresh: new Date() },
          },
        },
        include: { subscription: true, creditBalance: true },
      });

      await tx.creditTransaction.create({
        data: {
          userId: newUser.id,
          amount: 50,
          balanceAfter: 50,
          type: "DAILY_REFRESH",
          description: "Google OAuth: 50 Free Daily Credits",
        },
      });

      return newUser;
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.redirect(`${appUrl}/dashboard`);
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Google Callback Error:", err);
    return NextResponse.redirect(`${appUrl}/?error=google_auth_error`);
  }
}
