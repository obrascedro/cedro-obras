import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { homePathForRole, LOGIN_PATH } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const server = await createSupabaseServerClient();
      const {
        data: { user },
      } = await server.auth.getUser();

      if (user) {
        const { data: profile } = await server
          .from("profiles")
          .select("role, ativo")
          .eq("id", user.id)
          .maybeSingle();

        if (
          profile?.ativo &&
          (profile.role === "admin" || profile.role === "funcionario")
        ) {
          return NextResponse.redirect(
            `${origin}${homePathForRole(profile.role as "admin" | "funcionario")}`
          );
        }
      }

      return NextResponse.redirect(`${origin}${LOGIN_PATH}`);
    }
  }

  return NextResponse.redirect(`${origin}${LOGIN_PATH}?erro=auth-callback`);
}
