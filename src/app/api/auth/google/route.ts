import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { checkAndApplyDailyRefresh } from "@/lib/credits";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { credential, email, name, avatar, googleId } = await req.json();

    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;

    // 1. If Google ID Token credential was passed from Google One-Tap / Identity Services
    if (credential) {
      try {
        // Verify with Google's tokeninfo endpoint
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
        );
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          userEmail = payload.email;
          userName = payload.name;
          userAvatar = payload.picture;
        }
      } catch (verifyErr) {
        console.warn("Google token verification via tokeninfo failed:", verifyErr);
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "Valid Google email is required." },
        { status: 400 }
      );
    }

    const cleanEmail = userEmail.toLowerCase().trim();

    // 2. Upsert user in Supabase database
    const user = await prisma.$transaction(async (tx) => {
      let existing = await tx.user.findUnique({
        where: { email: cleanEmail },
        include: { subscription: true, creditBalance: true },
      });

      if (existing) {
        // Update avatar/name if not set
        if (!existing.avatar && userAvatar) {
          existing = await tx.user.update({
            where: { id: existing.id },
            data: { avatar: userAvatar, name: userName || existing.name },
            include: { subscription: true, creditBalance: true },
          });
        }
        return existing;
      }

      // Create new user with 50 free credits
      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          name: userName || cleanEmail.split("@")[0],
          avatar: userAvatar,
          role: cleanEmail.includes("admin") ? "ADMIN" : "USER",
          subscription: {
            create: {
              plan: "FREE",
              status: "ACTIVE",
              priceAmount: 0,
            },
          },
          creditBalance: {
            create: {
              currentBalance: 50,
              dailyAllowance: 50,
              lastCreditRefresh: new Date(),
            },
          },
        },
        include: {
          subscription: true,
          creditBalance: true,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: newUser.id,
          amount: 50,
          balanceAfter: 50,
          type: "DAILY_REFRESH",
          description: "Google Sign-In: 50 Free Daily Credits",
        },
      });

      return newUser;
    });

    await checkAndApplyDailyRefresh(user.id);

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        credits: user.creditBalance?.currentBalance ?? 50,
        plan: user.subscription?.plan ?? "FREE",
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Google Auth error:", err);
    return NextResponse.json(
      { error: err.message || "Google authentication failed." },
      { status: 500 }
    );
  }
}

// Redirect to Google OAuth Consent screen if visited via GET
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

  if (!clientId) {
    // If no Google Client ID configured, redirect back with notice
    return NextResponse.redirect(
      new URL("/?auth=google_client_id_missing", req.url)
    );
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

  return NextResponse.redirect(googleAuthUrl);
}
