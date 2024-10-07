import * as vscode from "vscode";
import * as underscore from "underscore.string";
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
  underscored: defaultFunction("underscored"),
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
  snake: (str: string) =>
    underscore
      .underscored(str)
      .replace(/([A-Z])[^A-Z]/g, " $1")
      .replace(/[^a-z]+/gi, " ")
      .trim()
      .replace(/\s/gi, "_"),
  screamingSnake: (str: string) =>
    underscore
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
  if (!editor) {
    return;
  }

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

  // Register the new quick pick command with Temporary Preview using Overlays
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "string-manipulation.quickPickTransform",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showInformationMessage(
            "No active editor found for transformation."
          );
          return;
        }

        const selections = editor.selections;
        if (selections.length === 0) {
          vscode.window.showInformationMessage("No text selected.");
          return;
        }

        // Store original text for all selections to allow reverting
        const originalTexts = selections.map((sel) =>
          editor.document.getText(sel)
        );

        // Function to apply a transformation and generate preview texts
        const applyTransformation = async (commandName: string) => {
          let stringFunc: (str: string) => string;

          if (functionNamesWithArgument.includes(commandName)) {
            const valueStr = await vscode.window.showInputBox({
              prompt: `Enter a number for "${commandName}"`,
              validateInput: (input) => {
                const num = Number(input);
                return isNaN(num) ? "Please enter a valid number." : null;
              },
              ignoreFocusOut: true,
            });
            if (valueStr === undefined) {
              return null; // User cancelled input
            }
            const value = Number(valueStr);
            stringFunc = (commandNameFunctionMap[commandName] as Function)(
              value
            );
          } else if (numberFunctionNames.includes(commandName)) {
            stringFunc = (str: string) =>
              (commandNameFunctionMap[commandName] as Function)(str, {});
          } else {
            stringFunc = commandNameFunctionMap[commandName] as StringFunction;
          }

          const transformedTexts = originalTexts.map((text) =>
            stringFunc(text)
          );

          return transformedTexts;
        };

        // Prepare QuickPick items
        const quickPickItems: vscode.QuickPickItem[] = Object.keys(
          commandNameFunctionMap
        ).map((cmd) => ({
          label: cmd,
          description: "Apply " + cmd + " transformation",
        }));

        // Create the QuickPick
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = quickPickItems;
        quickPick.placeholder = "Select a transformation to preview";

        // Create a decoration type for previews
        const decorationType = vscode.window.createTextEditorDecorationType({
          // Customize the appearance of the preview overlay
          backgroundColor: "rgba(0, 255, 0, 0.3)", // Semi-transparent green background for preview
          border: "1px dashed rgba(0, 255, 0, 0.8)", // Dashed border to indicate preview
          isWholeLine: false,
          // Optionally, show the transformed text as an overlay
          after: {
            contentText: "",
            color: "rgba(0,0,0,0.8)",
            backgroundColor: "rgba(0,255,0,0.2)",
          },
        });

        // Store current decorations to manage their lifecycle
        let currentDecorations: vscode.DecorationOptions[] = [];

        // Function to update decorations based on transformed texts
        const updateDecorations = (transformedTexts: string[]) => {
          currentDecorations = selections.map((sel, idx) => {
            const transformed = transformedTexts[idx];
            return {
              range: sel,
              renderOptions: {
                after: {
                  contentText: ` → ${transformed}`,
                  color: "rgba(0, 0, 0, 0.6)",
                  fontStyle: "italic",
                },
              },
            };
          });
          editor.setDecorations(decorationType, currentDecorations);
        };

        // Function to clear decorations
        const clearDecorations = () => {
          editor.setDecorations(decorationType, []);
          currentDecorations = [];
        };

        // Handle selection changes in QuickPick to update previews
        quickPick.onDidChangeSelection(async (selection) => {
          if (selection[0]) {
            const cmd = selection[0].label;
            const transformed = await applyTransformation(cmd);
            if (transformed) {
              updateDecorations(transformed);
            } else {
              clearDecorations();
            }
          }
        });

        // Handle QuickPick closure to remove decorations
        quickPick.onDidHide(() => {
          clearDecorations();
          quickPick.dispose();
          decorationType.dispose();
        });

        // Handle acceptance of a transformation
        quickPick.onDidAccept(async () => {
          const selected = quickPick.selectedItems[0];
          if (selected) {
            const cmd = selected.label;
            clearDecorations(); // Remove previews before applying changes
            await stringFunction(cmd, context);
          }
          quickPick.dispose();
          decorationType.dispose();
        });

        quickPick.show();
      }
    )
  );
}

export { commandNameFunctionMap };
