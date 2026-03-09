// ----------------------------------------------------SignUp page-------------------------------------------------------------------
import { SignupForm } from "@/components/signup-form";

export default function Signup() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="w-full max-w-md p-6">
        <SignupForm />
      </div>
    </div>
  );
}
