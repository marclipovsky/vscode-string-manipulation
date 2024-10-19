import * as vscode from "vscode";
import * as underscore from "underscore.string";
import { swapQuotes } from "./commands/swap_quotes";
const apStyleTitleCase = require("ap-style-title-case");
const chicagoStyleTitleCase = require("chicago-capitalize");
const slugify = require("@sindresorhus/slugify");

interface MultiSelectData {
  offset?: number;
}

const defaultFunction = (commandName: string, option?: any) => (str: string) =>
  (underscore as any)[commandName](str, option);

const sequence = (str: string, multiselectData: MultiSelectData = {}) => {
  return str.replace(/-?\d+/g, (n) => {
    const isFirst = typeof multiselectData.offset !== "number";
    multiselectData.offset = isFirst
      ? Number(n)
      : (multiselectData.offset || 0) + 1;
    return String(multiselectData.offset);
  });
};

const increment = (str: string) =>
  str.replace(/-?\d+/g, (n) => String(Number(n) + 1));

const decrement = (str: string) =>
  str.replace(/-?\d+/g, (n) => String(Number(n) - 1));

const randomCase = (input: string): string => {
  let result = "";
  for (const char of input) {
    if (Math.random() < 0.5) {
      result += char.toLowerCase();
    } else {
      result += char.toUpperCase();
    }
  }
  return result;
};

const snake = (str: string) =>
  underscore
    .underscored(str)
    .replace(/([A-Z])[^A-Z]/g, " $1")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .replace(/\s/gi, "_");

export type StringFunction = (
  str: string,
  multiselectData?: MultiSelectData
) => string;
export type CommandFunction =
  | StringFunction
  | ((...args: any[]) => StringFunction);

const commandNameFunctionMap: { [key: string]: CommandFunction } = {
  titleize: defaultFunction("titleize"),
  chop: (n: number) => defaultFunction("chop", n),
  classify: defaultFunction("classify"),
  clean: defaultFunction("clean"),
  cleanDiacritics: defaultFunction("cleanDiacritics"),
  underscored: snake,
  dasherize: defaultFunction("dasherize"),
  humanize: defaultFunction("humanize"),
  reverse: defaultFunction("reverse"),
  decapitalize: defaultFunction("decapitalize"),
  capitalize: defaultFunction("capitalize"),
  sentence: defaultFunction("capitalize", true),
  camelize: (str: string) =>
    underscore.camelize(/[a-z]/.test(str) ? str : str.toLowerCase()),
  slugify: slugify,
  swapCase: defaultFunction("swapCase"),
  snake,
  screamingSnake: (str: string) => snake(str).toUpperCase(),
  titleizeApStyle: apStyleTitleCase,
  titleizeChicagoStyle: chicagoStyleTitleCase,
  truncate: (n: number) => defaultFunction("truncate", n),
  prune: (n: number) => (str: string) => str.slice(0, n - 3).trim() + "...",
  repeat: (n: number) => defaultFunction("repeat", n),
  increment,
  decrement,
  duplicateAndIncrement: (str: string) => str + increment(str),
  duplicateAndDecrement: (str: string) => str + decrement(str),
  sequence,
  utf8ToChar: (str: string) =>
    str
      .match(/\\u[\dA-Fa-f]{4}/g)
      ?.map((x) => x.slice(2))
      .map((x) => String.fromCharCode(parseInt(x, 16)))
      .join("") || "",
  charToUtf8: (str: string) =>
    str
      .split("")
      .map((x) => `\\u${x.charCodeAt(0).toString(16).padStart(4, "0")}`)
      .join(""),
  randomCase,
  swapQuotes,
};

const numberFunctionNames = [
  "increment",
  "decrement",
  "sequence",
  "duplicateAndIncrement",
  "duplicateAndDecrement",
];

export const functionNamesWithArgument = [
  "chop",
  "truncate",
  "prune",
  "repeat",
];

export const stringFunction = async (
  commandName: string,
  context: vscode.ExtensionContext,
  shouldApply = true
): Promise<{ replacedSelections: string[] } | undefined> => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const selectionMap: {
    [key: number]: { selection: vscode.Selection; replaced: string };
  } = {};

  let multiselectData: MultiSelectData = {};

  let stringFunc: (str: string) => string;

  let replacedSelections = [];

  if (functionNamesWithArgument.includes(commandName)) {
    const valueStr = await vscode.window.showInputBox();
    if (valueStr === undefined) {
      return;
    }
    const value = Number(valueStr);
    if (isNaN(value)) {
      vscode.window.showErrorMessage("Invalid number");
      return;
    }
    stringFunc = (commandNameFunctionMap[commandName] as Function)(value);
  } else if (numberFunctionNames.includes(commandName)) {
    stringFunc = (str: string) =>
      (commandNameFunctionMap[commandName] as Function)(str, multiselectData);
  } else {
    stringFunc = commandNameFunctionMap[commandName] as StringFunction;
  }

  for (const [index, selection] of editor.selections.entries()) {
    const text = editor.document.getText(selection);
    const textParts = text.split("\n");
    const replaced = textParts.map((part) => stringFunc(part)).join("\n");
    replacedSelections.push(replaced);
    selectionMap[index] = { selection, replaced };
  }

  if (shouldApply) {
    await editor.edit((builder) => {
      Object.values(selectionMap).forEach(({ selection, replaced }) => {
        builder.replace(selection, replaced);
      });
    });

    context.globalState.update("lastAction", commandName);
  }

  return await Promise.resolve({ replacedSelections });
};

export function activate(context: vscode.ExtensionContext) {
  context.globalState.setKeysForSync(["lastAction"]);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "string-manipulation.repeatLastAction",
      () => {
        const lastAction = context.globalState.get<string>("lastAction");
        if (lastAction) {
          return stringFunction(lastAction, context);
        }
      }
    )
  );

  Object.keys(commandNameFunctionMap).forEach((commandName) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `string-manipulation.${commandName}`,
        () => stringFunction(commandName, context)
      )
    );
  });
}

export { commandNameFunctionMap };
