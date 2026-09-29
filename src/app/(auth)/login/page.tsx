import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import { redirect } from "next/navigation";
import AuthShell from "@/Components/Frontend/Pages/Auth/AuthShell";
import LoginForm from "@/Components/Frontend/Pages/Auth/LoginForm";
import { isSignedIn, safeNext } from "@/app/lib/session";

export const metadata: Metadata = pageMetadata({
  title: "Sign In",
  description: "Sign in to ByteSpace to continue your courses, track progress and manage your orders.",
  path: "/login",
});

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  if (await isSignedIn()) redirect(next);

  return (
    <AuthShell
      heading="Sign in with ease"
      text="Experience a seamless and efficient sign-in process that grants you instant access to a world of knowledge."
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
