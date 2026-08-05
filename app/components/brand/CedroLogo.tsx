import Image from "next/image";
import Link from "next/link";
import {
  LOGO_ALT,
  LOGO_PATH,
} from "@/lib/brand";

type CedroLogoVariant = "header" | "login" | "sidebar" | "compact" | "portal";

type CedroLogoProps = {
  variant?: CedroLogoVariant;
  priority?: boolean;
  className?: string;
  href?: string;
};

const variantClass: Record<CedroLogoVariant, string> = {
  header: "h-auto w-[120px] sm:w-[130px] md:w-[140px]",
  portal: "h-auto w-[300px] sm:w-[332px] md:w-[360px] max-w-[92vw]",
  login: "h-auto w-[190px] sm:w-[210px] lg:w-[240px] max-w-[85vw]",
  sidebar: "h-auto w-[165px] sm:w-[175px] md:w-[185px] max-w-full",
  compact: "h-9 w-9",
};

const variantIntrinsic: Record<CedroLogoVariant, { width: number; height: number }> = {
  header: { width: 140, height: 140 },
  portal: { width: 360, height: 360 },
  login: { width: 240, height: 240 },
  sidebar: { width: 185, height: 185 },
  compact: { width: 36, height: 36 },
};

export default function CedroLogo({
  variant = "header",
  priority = false,
  className = "",
  href,
}: CedroLogoProps) {
  const { width, height } = variantIntrinsic[variant];

  const image = (
    <Image
      src={LOGO_PATH}
      alt={LOGO_ALT}
      width={width}
      height={height}
      priority={priority}
      className={`object-contain ${variantClass[variant]} ${className}`.trim()}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex shrink-0 focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cedro-brown)] focus-visible:ring-offset-2"
      >
        {image}
      </Link>
    );
  }

  return image;
}
