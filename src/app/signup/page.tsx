import { isGoogleOAuthConfigured } from "@/lib/auth/config";
import { AuthScreen } from "@/components/auth-screen";

export default function SignupPage() {
  return <AuthScreen mode="signup" googleConfigured={isGoogleOAuthConfigured()} />;
}
