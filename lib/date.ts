export function nextMonthStart(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}
