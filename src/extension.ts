import * as vscode from "vscode";
import * as _string from "underscore.string";
import apStyleTitleCase from "ap-style-title-case";
import chicagoStyleTitleCase from "chicago-capitalize";
import slugify from "@sindresorhus/slugify";

interface MultiSelectData {
  offset?: number;
}

const defaultFunction = (commandName: string, option?: any) => (str: string) =>
  (_string as any)[commandName](str, option);

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

type StringFunction = (str: string) => string;
type CommandFunction = StringFunction | ((...args: any[]) => StringFunction);

const commandNameFunctionMap: { [key: string]: CommandFunction } = {
  titleize: defaultFunction("titleize"),
  chop: (n: number) => defaultFunction("chop", n),
  classify: defaultFunction("classify"),
  clean: defaultFunction("clean"),
  cleanDiacritics: defaultFunction("cleanDiacritics"),
  underscored: defaultFunction("underscored"),
  dasherize: defaultFunction("dasherize"),
  humanize: defaultFunction("humanize"),
  reverse: defaultFunction("reverse"),
  decapitalize: defaultFunction("decapitalize"),
  capitalize: defaultFunction("capitalize"),
  sentence: defaultFunction("capitalize", true),
  camelize: (str: string) =>
    _string.camelize(/[a-z]/.test(str) ? str : str.toLowerCase()),
  slugify: slugify,
  swapCase: defaultFunction("swapCase"),
  snake: (str: string) =>
    _string
      .underscored(str)
      .replace(/([A-Z])[^A-Z]/g, " $1")
      .replace(/[^a-z]+/gi, " ")
      .trim()
      .replace(/\s/gi, "_"),
  screamingSnake: (str: string) =>
    _string
      .underscored(str)
      .replace(/([A-Z])[^A-Z]/g, " $1")
      .replace(/[^a-z]+/gi, " ")
      .trim()
      .replace(/\s/gi, "_")
      .toUpperCase(),
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
};

const numberFunctionNames = [
  "increment",
  "decrement",
  "sequence",
  "duplicateAndIncrement",
  "duplicateAndDecrement",
];

const functionNamesWithArgument = ["chop", "truncate", "prune", "repeat"];

const stringFunction = async (
  commandName: string,
  context: vscode.ExtensionContext
) => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const selectionMap: {
    [key: number]: { selection: vscode.Selection; replaced: string };
  } = {};

  let multiselectData: MultiSelectData = {};

  let stringFunc: (str: string) => string;

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
    selectionMap[index] = { selection, replaced };
  }

  await editor.edit((builder) => {
    Object.values(selectionMap).forEach(({ selection, replaced }) => {
      builder.replace(selection, replaced);
    });
  });

  context.globalState.update("lastAction", commandName);
};

export function activate(context: vscode.ExtensionContext) {
  context.globalState.setKeysForSync(["lastAction"]);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "string-manipulation.repeatLastAction",
      async () => {
        const lastAction = context.globalState.get<string>("lastAction");
        if (lastAction) {
          await stringFunction(lastAction, context);
        }
      }
    )
  );

  Object.keys(commandNameFunctionMap).forEach((commandName) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `string-manipulation.${commandName}`,
        async () => {
          await stringFunction(commandName, context);
        }
      )
    );
  });
}

export { commandNameFunctionMap };
