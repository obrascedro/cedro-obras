import { redirect } from "next/navigation";
import LandingPage from "@/app/components/landing/LandingPage";
import { getAppSession, homePathForRole } from "@/lib/auth";

export default async function HomePage() {
  const session = await getAppSession();

  if (session) {
    redirect(homePathForRole(session.role));
  }

  return <LandingPage />;
}
