export function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

export function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric"
  }).format(date);
}

export function toMonthInputValue(date = new Date()) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function getRollingSixMonthRange(monthValue = toMonthInputValue()) {
  const [year, month] = monthValue.split("-").map(Number);
  const end = new Date(year, month, 0);
  const start = new Date(year, month - 6, 1);

  const startIso = `${start.getFullYear()}-${`${start.getMonth() + 1}`.padStart(2, "0")}-01`;
  const endIso = `${end.getFullYear()}-${`${end.getMonth() + 1}`.padStart(2, "0")}-${`${end.getDate()}`.padStart(2, "0")}`;

  return { start, end, startIso, endIso };
}

export function statusLabel(status: string) {
  return status === "selesai" ? "Selesai" : "Belum selesai";
}
