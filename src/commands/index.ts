import * as vscode from "vscode";
import {
  CommandRegistry,
  functionNamesWithArgument,
  numberFunctionNames,
  CommandFunction,
} from "./types";
import * as defaultFunctions from "./default-functions";
import {
  increment,
  decrement,
  duplicateAndIncrement,
  duplicateAndDecrement,
  handleDuplicateAndIncrementDecrement,
  updateSelectionsAfterDuplicate,
  incrementFloat,
  decrementFloat,
} from "./increment-decrement";
import { sequence } from "./sequence";
import { randomCase } from "./random-case";
import { utf8ToChar, charToUtf8 } from "./utf8-conversion";
import { titleizeApStyle, titleizeChicagoStyle } from "./title-case";
import { slugify } from "./slugify";
import { swapQuotes } from "./swap_quotes";

// Combine all commands into a single registry
export const commandNameFunctionMap: CommandRegistry = {
  // Default functions
  titleize: defaultFunctions.titleize,
  chop: defaultFunctions.chop,
  classify: defaultFunctions.classify,
  clean: defaultFunctions.clean,
  cleanDiacritics: defaultFunctions.cleanDiacritics,
  underscored: defaultFunctions.snake,
  dasherize: defaultFunctions.dasherize,
  humanize: defaultFunctions.humanize,
  reverse: defaultFunctions.reverse,
  decapitalize: defaultFunctions.decapitalize,
  capitalize: defaultFunctions.capitalize,
  sentence: defaultFunctions.sentence,
  camelize: defaultFunctions.camelize,
  swapCase: defaultFunctions.swapCase,
  snake: defaultFunctions.snake,
  screamingSnake: defaultFunctions.screamingSnake,
  truncate: defaultFunctions.truncate,
  prune: defaultFunctions.prune,
  repeat: defaultFunctions.repeat,

  // Specialized functions
  increment,
  decrement,
  duplicateAndIncrement,
  duplicateAndDecrement,
  incrementFloat,
  decrementFloat,
  sequence,
  utf8ToChar,
  charToUtf8,
  randomCase,
  titleizeApStyle,
  titleizeChicagoStyle,
  slugify,
  swapQuotes,
};

// Re-export types and constants
export {
  functionNamesWithArgument,
  numberFunctionNames,
  CommandFunction,
} from "./types";

// Main string function that applies the transformations
export const stringFunction = async (
  commandName: string,
  context: vscode.ExtensionContext,
  shouldApply = true
): Promise<{ replacedSelections: string[] } | undefined> => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  let selectionMap: {
    [key: number]: { selection: vscode.Selection; replaced: string };
  } = {};

  let multiselectData = {};

  let stringFunc: (str: string) => string;

  let replacedSelections: string[] = [];

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
    stringFunc = commandNameFunctionMap[commandName] as (str: string) => string;
  }

  if (
    commandName === "duplicateAndIncrement" ||
    commandName === "duplicateAndDecrement"
  ) {
    const operation =
      commandName === "duplicateAndIncrement" ? increment : decrement;

    const result = handleDuplicateAndIncrementDecrement(
      editor,
      editor.selections,
      operation as (str: string) => string
    );
    selectionMap = result.selectionMap;
    replacedSelections = result.replacedSelections;
  } else {
    for (const [index, selection] of editor.selections.entries()) {
      const text = editor.document.getText(selection);
      const textParts = text.split("\n");
      const replaced = textParts.map((part) => stringFunc(part)).join("\n");
      replacedSelections.push(replaced);
      selectionMap[index] = { selection, replaced };
    }
  }

  if (shouldApply) {
    await editor.edit((builder) => {
      Object.values(selectionMap).forEach(({ selection, replaced }) => {
        builder.replace(selection, replaced);
      });
    });

    // Set the selection to the duplicated part for duplicateAndIncrement and duplicateAndDecrement
    if (
      commandName === "duplicateAndIncrement" ||
      commandName === "duplicateAndDecrement"
    ) {
      editor.selections = updateSelectionsAfterDuplicate(editor, selectionMap);
    }

    context.globalState.update("lastAction", commandName);
  }

  return await Promise.resolve({ replacedSelections });
};

// Activation function
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
