import { ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  subtitle,
  children,
  rightSlot,
  className = "",
}: Props) {
  return (
    <section className={`rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 ${className}`}>
      {(title || subtitle || rightSlot) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-zinc-300/80">{subtitle}</p> : null}
          </div>

          {rightSlot ? <div>{rightSlot}</div> : null}
        </div>
      )}

      {children}
    </section>
  );
}