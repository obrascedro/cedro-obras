"use client";

import { useState } from "react";
import PortalAcompanhamentoForm from "@/app/components/portal-acompanhamento/PortalAcompanhamentoForm";
import PortalAcompanhamentoHistorico from "@/app/components/portal-acompanhamento/PortalAcompanhamentoHistorico";
import type { ObraOption } from "@/lib/notas-fiscais";

type PortalAcompanhamentoAppProps = {
  obras: ObraOption[];
};

export default function PortalAcompanhamentoApp({
  obras,
}: PortalAcompanhamentoAppProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="space-y-6">
      <PortalAcompanhamentoForm
        key={formKey}
        obras={obras}
        onEnviado={() => {
          setFormKey((k) => k + 1);
          setRefreshKey((k) => k + 1);
        }}
      />
      <PortalAcompanhamentoHistorico refreshKey={refreshKey} />
    </div>
  );
}
