import Link from "next/link";

type ActionItem = {
  label: string;
  href?: string;
  onClick?: never;
  variant?: "default" | "primary";
};

type Props = {
  title: string;
  subtitle?: string;
  actions?: ActionItem[];
};

export default function PageHeader({ title, subtitle, actions = [] }: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-300/80">{subtitle}</p>
        ) : null}
      </div>

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) =>
            action.href ? (
              <Link
                key={`${action.label}-${index}`}
                href={action.href}
                target="_self"
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium transition ring-1",
                  action.variant === "primary"
                    ? "bg-amber-400/90 text-zinc-950 ring-amber-300/30 hover:bg-amber-400"
                    : "bg-white/10 text-white ring-white/10 hover:bg-white/15",
                ].join(" ")}
              >
                {action.label}
              </Link>
            ) : null
          )}
        </div>
      ) : null}
    </div>
  );
}
