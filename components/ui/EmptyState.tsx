type Props = {
  title: string;
  description?: string;
};

export default function EmptyState({ title, description }: Props) {
  return (
    <div className="rounded-2xl bg-zinc-950/40 p-8 text-center ring-1 ring-white/10">
      <p className="text-base font-medium text-white">{title}</p>
      {description ? <p className="mt-2 text-sm text-zinc-400">{description}</p> : null}
    </div>
  );
}