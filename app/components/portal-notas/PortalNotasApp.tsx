"use client";

import { useState } from "react";
import PortalNotasEnvioForm from "@/app/components/portal-notas/PortalNotasEnvioForm";
import type { ObraOption } from "@/lib/notas-fiscais";

type PortalNotasAppProps = {
  nomeFuncionario: string;
  obras: ObraOption[];
};

export default function PortalNotasApp({
  nomeFuncionario,
  obras,
}: PortalNotasAppProps) {
  const [formKey, setFormKey] = useState(0);

  return (
    <PortalNotasEnvioForm
      key={formKey}
      nomeFuncionario={nomeFuncionario}
      obras={obras}
      onNovaNota={() => setFormKey((k) => k + 1)}
    />
  );
}
