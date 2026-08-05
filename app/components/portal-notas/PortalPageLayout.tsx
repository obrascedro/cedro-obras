import Image from "next/image";
import LogoutButton from "@/app/components/auth/LogoutButton";
import CedroLogo from "@/app/components/brand/CedroLogo";
import PortalNav from "@/app/components/portal-notas/PortalNav";
import { PORTAL_HEADER_IMAGE } from "@/lib/portal-notas/config";

type PortalPageLayoutProps = {
  nomeFuncionario: string;
  activePath: string;
  alert?: React.ReactNode;
  children: React.ReactNode;
};

export default function PortalPageLayout({
  nomeFuncionario,
  activePath,
  alert,
  children,
}: PortalPageLayoutProps) {
  return (
    <div className="min-h-dvh bg-white">
      <div className="relative h-[120px] w-full">
        <Image
          src={PORTAL_HEADER_IMAGE}
          alt=""
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute right-4 top-3 z-10 sm:right-5">
          <LogoutButton portal />
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-4 sm:px-5">
        <div className="-mt-8 flex justify-center sm:-mt-10">
          <CedroLogo variant="portal" priority />
        </div>

        <h1 className="mt-3 text-center text-[1.375rem] font-bold leading-tight tracking-tight text-[var(--cedro-text)] sm:mt-4 sm:text-2xl">
          Olá, {nomeFuncionario} 👋
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-[var(--cedro-text-muted)]">
          Envie suas notas fiscais para aprovação de forma rápida e segura.
        </p>

        <PortalNav activePath={activePath} className="mt-5" />

        {alert ? <div className="mt-4">{alert}</div> : null}

        <div className="mt-4 pb-10 sm:pb-12">{children}</div>
      </div>
    </div>
  );
}
