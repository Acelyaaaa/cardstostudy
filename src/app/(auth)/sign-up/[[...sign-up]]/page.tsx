import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Create your account
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Start studying smarter today — it&apos;s free
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              card: "shadow-none border border-gray-200 rounded-xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton:
                "border border-gray-200 hover:bg-gray-50 rounded-lg",
              formButtonPrimary:
                "bg-indigo-500 hover:bg-indigo-600 rounded-lg",
              footerActionLink:
                "text-indigo-600 hover:text-indigo-700",
              formFieldInput:
                "rounded-lg border-gray-200 focus:ring-indigo-500",
            },
          }}
        />
      </div>
    </div>
  );
}