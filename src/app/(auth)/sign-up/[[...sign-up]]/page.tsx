import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start studying smarter today — it&apos;s free</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              card: "shadow-none border border-gray-200 rounded-xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 rounded-lg",
              formButtonPrimary: "bg-violet-600 hover:bg-violet-700 rounded-lg",
              footerActionLink: "text-violet-600 hover:text-violet-700",
              formFieldInput: "rounded-lg border-gray-200 focus:ring-violet-500",
            },
          }}
        />
        <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}