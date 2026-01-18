export type IsoDateString = string;
export type IsoDateTimeString = string;

export function nowIsoUtc(): IsoDateTimeString {
  return new Date().toISOString();
}

export function parseIsoUtc(iso: IsoDateTimeString): Date {
  return new Date(iso);
}

export function toIsoDateInTimeZone(isoUtc: IsoDateTimeString, timeZone: string): IsoDateString {
  const date = parseIsoUtc(isoUtc);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error(`Failed to format date in timezone: ${timeZone}`);
  }

  return `${year}-${month}-${day}`;
}

