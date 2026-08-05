import { NextResponse } from "next/server";
import { getAppSession, ADMIN_ROLE } from "@/lib/auth";

export async function assertAdminApi(): Promise<
  NextResponse<{ error: string }> | null
> {
  const session = await getAppSession();
  if (!session || session.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return null;
}
