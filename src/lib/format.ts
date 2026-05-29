export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(iso: string, withTime = true) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

export function relativeDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round(
    (new Date(d.toDateString()).getTime() -
      new Date(today.toDateString()).getTime()) /
      864e5,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long" });
}
