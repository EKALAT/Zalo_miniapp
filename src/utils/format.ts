export function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    currencyDisplay: "code",
  }).format(price);
}

// App-wide timezone for displaying dates: UTC+07 (Bangkok/Hanoi/Jakarta)
export const APP_TIME_ZONE = "Asia/Bangkok";

export function formatDateTime(date: string | number | Date) {
  const d = new Date(date);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatDate(date: string | number | Date) {
  const d = new Date(date);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}