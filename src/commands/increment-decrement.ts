import * as vscode from "vscode";
import { CommandFunction } from "./types";

export const increment: CommandFunction = (str: string) =>
  str.replace(/-?\d+/g, (n) => String(Number(n) + 1));

export const decrement: CommandFunction = (str: string) =>
  str.replace(/-?\d+/g, (n) => String(Number(n) - 1));

// These functions are placeholders as the actual implementation is in the stringFunction
// They're kept here for type consistency in the command registry
export const duplicateAndIncrement: CommandFunction = () => "";
export const duplicateAndDecrement: CommandFunction = () => "";

// Helper function to handle duplicate and increment/decrement operations
export function handleDuplicateAndIncrementDecrement(
  editor: vscode.TextEditor,
  selections: readonly vscode.Selection[],
  operation: (str: string) => string
): {
  selectionMap: {
    [key: number]: { selection: vscode.Selection; replaced: string };
  };
  replacedSelections: string[];
} {
  const selectionMap: {
    [key: number]: { selection: vscode.Selection; replaced: string };
  } = {};
  const replacedSelections: string[] = [];

  for (const [index, selection] of selections.entries()) {
    const text = editor.document.getText(selection);
    const replaced = text + operation(text);

    replacedSelections.push(replaced);
    selectionMap[index] = { selection, replaced };
  }

  return { selectionMap, replacedSelections };
}

// Helper function to update selections after duplicate operations
export function updateSelectionsAfterDuplicate(
  editor: vscode.TextEditor,
  selectionMap: {
    [key: number]: { selection: vscode.Selection; replaced: string };
  }
): vscode.Selection[] {
  return editor.selections.map((selection, index) => {
    const originalSelection = selectionMap[index].selection;
    const originalText = editor.document.getText(originalSelection);

    // Calculate the start position of the duplicated text
    const startPos = originalSelection.end;

    // Calculate the end position based on the original text length
    let endLine = startPos.line;
    let endChar = startPos.character + originalText.length;

    // Handle multi-line selections
    const lines = originalText.split("\n");
    if (lines.length > 1) {
      endLine = startPos.line + lines.length - 1;
      // If multi-line, the end character should be the length of the last line
      endChar = lines[lines.length - 1].length;
    }

    const endPos = new vscode.Position(endLine, endChar);
    return new vscode.Selection(startPos, endPos);
  });
}
