import { CommandFunction } from "./types";

export const increment: CommandFunction = (str: string) =>
  str.replace(/-?\d+/g, (n) => String(Number(n) + 1));

export const decrement: CommandFunction = (str: string) =>
  str.replace(/-?\d+/g, (n) => String(Number(n) - 1));

export const duplicateAndIncrement: CommandFunction = () => "";
export const duplicateAndDecrement: CommandFunction = () => "";
