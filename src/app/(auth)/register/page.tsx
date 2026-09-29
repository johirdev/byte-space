import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import { redirect } from "next/navigation";
import AuthShell from "@/Components/Frontend/Pages/Auth/AuthShell";
import RegisterForm from "@/Components/Frontend/Pages/Auth/RegisterForm";
import { isSignedIn, safeNext } from "@/app/lib/session";

export const metadata: Metadata = pageMetadata({
  title: "Create a Free Account",
  description: "Join ByteSpace for free — enrol in courses, track your progress and learn practical skills from verified creators.",
  path: "/register",
});

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const next = safeNext((await searchParams).next);
  if (await isSignedIn()) redirect(next);

  return (
    <AuthShell
      heading="Sign up and come in"
      text="The registration process is straightforward, uncomplicated, and efficient, allowing users to sign up quickly, easily, and at no cost"
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
