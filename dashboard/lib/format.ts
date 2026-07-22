// Norsk (nb-NO) formattering av tall, valuta og dato.

const usd = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const pctFmt = new Intl.NumberFormat("nb-NO", {
  maximumFractionDigits: 2,
  signDisplay: "always",
});

export const fmtUsd = (n: number) => usd.format(n);

export const fmtPct = (n: number) => `${pctFmt.format(n)} %`;

export const fmtNum = (n: number, decimals = 2) =>
  new Intl.NumberFormat("nb-NO", { maximumFractionDigits: decimals }).format(n);

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// "for 3 timer siden" o.l.
export function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "akkurat nå";
  if (min < 60) return `for ${min} min siden`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `for ${hours} t siden`;
  const days = Math.round(hours / 24);
  return `for ${days} d siden`;
}
