import Link from "next/link";

const OPTIONS = [
  { p: "7", label: "7d" },
  { p: "30", label: "30d" },
  { p: "alt", label: "Alt" },
];

export function PeriodSelector({ base, active }: { base: string; active: string }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-0.5 text-sm">
      {OPTIONS.map((o) => (
        <Link
          key={o.p}
          href={`${base}?p=${o.p}`}
          className={`rounded-full px-3 py-1 transition-colors ${
            active === o.p ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
