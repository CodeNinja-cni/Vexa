import { isGoogleOAuthConfigured } from "@/lib/auth/config";
import { AuthScreen } from "@/components/auth-screen";

const oauthErrors: Record<string, string> = {
  missing_oauth_response: "Google did not return a complete sign-in response.",
  google_connection_failed: "Google sign-in could not be completed. Please try again.",
  access_denied: "Google sign-in was cancelled.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ authError?: string }> }) {
  const { authError } = await searchParams;
  return <AuthScreen mode="login" googleConfigured={isGoogleOAuthConfigured()} authError={authError ? oauthErrors[authError] ?? "Google sign-in could not be completed." : undefined} />;
}
