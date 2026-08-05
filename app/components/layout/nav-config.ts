export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "notas" | "admin" | "funcionarios" | "clientes" | "obras" | "acompanhamento" | "financeiro" | "assistente" | "auditoria";
  match?: (pathname: string) => boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

function matchPrefix(prefix: string) {
  return (pathname: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Principal",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: "dashboard",
        match: (p) => p === "/dashboard",
      },
    ],
  },
  {
    title: "Portal de Notas",
    items: [
      {
        href: "/financeiro/notas-fiscais",
        label: "Notas fiscais",
        icon: "notas",
        match: matchPrefix("/financeiro/notas-fiscais"),
      },
    ],
  },
  {
    title: "Administrativo",
    items: [
      {
        href: "/admin",
        label: "Admin",
        icon: "admin",
        match: (p) => p === "/admin",
      },
      {
        href: "/admin/funcionarios",
        label: "Funcionários",
        icon: "funcionarios",
        match: matchPrefix("/admin/funcionarios"),
      },
      { href: "/clientes", label: "Clientes", icon: "clientes", match: matchPrefix("/clientes") },
      { href: "/obras", label: "Obras", icon: "obras", match: matchPrefix("/obras") },
      {
        href: "/acompanhamento-obras",
        label: "Acompanhamento de Obras",
        icon: "acompanhamento",
        match: matchPrefix("/acompanhamento-obras"),
      },
    ],
  },
  {
    title: "Relatórios",
    items: [
      {
        href: "/financeiro",
        label: "Financeiro",
        icon: "financeiro",
        match: (p) => p === "/financeiro",
      },
      {
        href: "/financeiro/assistente",
        label: "Assistente IA",
        icon: "assistente",
        match: matchPrefix("/financeiro/assistente"),
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        href: "/admin/auditoria",
        label: "Auditoria",
        icon: "auditoria",
        match: matchPrefix("/admin/auditoria"),
      },
    ],
  },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
