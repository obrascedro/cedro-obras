import PortalPageLayout from "@/app/components/portal-notas/PortalPageLayout";

type PortalShellProps = {
  nomeFuncionario: string;
  activePath: string;
  alert?: React.ReactNode;
  children: React.ReactNode;
};

/** @deprecated Use PortalPageLayout directly */
export default function PortalShell(props: PortalShellProps) {
  return <PortalPageLayout {...props} />;
}

export { PortalPageLayout };
