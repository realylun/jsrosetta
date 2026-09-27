const formatter = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function DateFormatter({ dateString }: { dateString: string }) {
  return <time dateTime={dateString}>{formatter.format(new Date(dateString))}</time>;
}
