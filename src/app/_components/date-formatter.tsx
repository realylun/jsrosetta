import { useFormatter } from "next-intl";

export function DateFormatter({ dateString }: { dateString: string }) {
  const format = useFormatter();
  return (
    <time dateTime={dateString}>
      {format.dateTime(new Date(dateString), {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })}
    </time>
  );
}
