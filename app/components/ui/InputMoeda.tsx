"use client";

import { useState } from "react";
import {
  formatMoedaBrInput,
  mascaraMoedaBrDigitando,
  parseMoedaBr,
} from "@/lib/moeda-br";
import { inputClassName } from "@/app/components/ui/form-styles";

type InputMoedaProps = {
  id: string;
  value: number;
  onChange: (valor: number) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export default function InputMoeda({
  id,
  value,
  onChange,
  required,
  disabled,
  placeholder = "0,00",
}: InputMoedaProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatMoedaBrInput(value));

  const displayValue = focused ? draft : formatMoedaBrInput(value);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      value={displayValue}
      onFocus={() => {
        setFocused(true);
        setDraft(formatMoedaBrInput(value));
      }}
      onChange={(e) => {
        const masked = mascaraMoedaBrDigitando(e.target.value);
        setDraft(masked);
        onChange(parseMoedaBr(masked));
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = parseMoedaBr(draft);
        onChange(parsed);
        setDraft(formatMoedaBrInput(parsed));
      }}
      className={inputClassName}
    />
  );
}
