import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import { redirect } from "next/navigation";
import Profile, { type ProfileTab } from "@/Components/Frontend/Pages/Profile/Profile";
import { isSignedIn } from "@/app/lib/session";

export const metadata: Metadata = pageMetadata({
  title: "My Profile",
  path: "/profile",
  noindex: true,
});

const TABS: ProfileTab[] = ["courses", "orders", "reviews", "settings"];

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  if (!(await isSignedIn())) redirect("/login?next=/profile");
  const params = await searchParams;
  const tab = typeof params.tab === "string" && TABS.includes(params.tab as ProfileTab) ? (params.tab as ProfileTab) : "courses";
  const order = typeof params.order === "string" ? params.order : undefined;
  return <Profile initialTab={tab} newOrder={order} />;
}
