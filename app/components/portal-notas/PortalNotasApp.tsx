"use client";

import { useState } from "react";
import PortalNotasEnvioForm from "@/app/components/portal-notas/PortalNotasEnvioForm";
import type { ObraOption } from "@/lib/notas-fiscais";

type PortalNotasAppProps = {
  obras: ObraOption[];
};

export default function PortalNotasApp({ obras }: PortalNotasAppProps) {
  const [formKey, setFormKey] = useState(0);

  return (
    <PortalNotasEnvioForm
      key={formKey}
      obras={obras}
      onNovaNota={() => setFormKey((k) => k + 1)}
    />
  );
}
