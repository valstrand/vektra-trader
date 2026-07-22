import { Card } from "@/components/ui/Card";

export function AgentCard({
  name,
  role,
  children,
  meta,
}: {
  name: string;
  role: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold tracking-tight">{name}</h3>
          <p className="text-xs text-muted">{role}</p>
        </div>
        {meta}
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-fg/90">{children}</div>
    </Card>
  );
}

// Sitatblokk for agentens egne ord.
export function Reasoning({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium tracking-wide text-muted uppercase">{label}</div>
      <p className="whitespace-pre-wrap border-l-2 border-border pl-3 text-fg/80">{text}</p>
    </div>
  );
}
