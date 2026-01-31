export type Money4 = number;
export type Rate8 = number;
export type Quantity8 = number;

export function toMoney4(value: number): Money4 {
  return Math.round(value * 10_000);
}

export function fromMoney4(value4: Money4): number {
  return value4 / 10_000;
}

export function roundMoney4(value: number): number {
  return fromMoney4(toMoney4(value));
}

export function toRate8(value: number): Rate8 {
  return Math.round(value * 100_000_000);
}

export function fromRate8(value8: Rate8): number {
  return value8 / 100_000_000;
}

export function toQuantity8(value: number): Quantity8 {
  return Math.round(value * 100_000_000);
}

export function fromQuantity8(value8: Quantity8): number {
  return value8 / 100_000_000;
}
