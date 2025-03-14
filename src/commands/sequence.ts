import { CommandFunction, MultiSelectData } from "./types";

export const sequence: CommandFunction = (
  str: string,
  multiselectData: MultiSelectData = {}
) => {
  return str.replace(/-?\d+/g, (n) => {
    const isFirst = typeof multiselectData.offset !== "number";
    multiselectData.offset = isFirst
      ? Number(n)
      : (multiselectData.offset || 0) + 1;
    return String(multiselectData.offset);
  });
};
