import { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export default function FormField({ label, children, hint }: Props) {
  return (
    <div>
      <label className="text-sm text-white/85">{label}</label>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}