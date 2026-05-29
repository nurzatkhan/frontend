const COLORS = [
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

function initials(name: string) {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const color = COLORS[name.length % COLORS.length];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold uppercase ${color} ${className}`}
    >
      {initials(name) || "?"}
    </div>
  );
}
