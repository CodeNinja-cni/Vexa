import { z } from "zod";

const googleOAuthConfigSchema = z.object({
  authSecret: z.string().min(32),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  appUrl: z.string().url(),
});

export interface GoogleOAuthConfig {
  authSecret: string;
  clientId: string;
  clientSecret: string;
  appUrl: string;
  redirectUri: string;
  secureCookies: boolean;
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const parsed = googleOAuthConfigSchema.safeParse({
    authSecret: process.env.AUTH_SECRET,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    appUrl: process.env.VEXA_APP_URL ?? "http://localhost:3000",
  });

  if (!parsed.success) {
    throw new Error(
      "Google OAuth is not configured. Set AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and VEXA_APP_URL.",
    );
  }

  const appUrl = parsed.data.appUrl.replace(/\/$/, "");

  return {
    ...parsed.data,
    appUrl,
    redirectUri: `${appUrl}/api/auth/google/callback`,
    secureCookies: appUrl.startsWith("https://"),
  };
}

export function isGoogleOAuthConfigured(): boolean {
  try {
    getGoogleOAuthConfig();
    return true;
  } catch {
    return false;
  }
}
