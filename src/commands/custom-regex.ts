import * as vscode from "vscode";

export interface CustomCommand {
  name: string;
  searchPattern: string;
  replacement: string;
  // Named flag properties based on RegExp properties
  global?: boolean;        // g flag
  ignoreCase?: boolean;    // i flag
  multiline?: boolean;     // m flag
  dotAll?: boolean;        // s flag
  unicode?: boolean;       // u flag
  sticky?: boolean;        // y flag
}

export function convertNamedFlagsToString(command: CustomCommand): string {
  let flags = "";
  if (command.global) { flags += "g"; }
  if (command.ignoreCase) { flags += "i"; }
  if (command.multiline) { flags += "m"; }
  if (command.dotAll) { flags += "s"; }
  if (command.unicode) { flags += "u"; }
  if (command.sticky) { flags += "y"; }
  
  // Default to global if no flags specified
  return flags || "g";
}

export function validateRegexPattern(
  pattern: string,
  flags: string = "g"
): { isValid: boolean; error?: string } {
  try {
    new RegExp(pattern, flags);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Invalid regular expression",
    };
  }
}

export function createCustomRegexFunction(
  command: CustomCommand
): (str: string) => string {
  return (str: string) => {
    const flags = convertNamedFlagsToString(command);
    const validation = validateRegexPattern(command.searchPattern, flags);
    if (!validation.isValid) {
      throw new Error(
        `Invalid regex pattern in custom command "${command.name}": ${validation.error}`
      );
    }

    try {
      const regex = new RegExp(command.searchPattern, flags);
      return str.replace(regex, command.replacement);
    } catch (error) {
      throw new Error(
        `Error executing custom command "${command.name}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };
}

export function validateCustomCommand(command: any): {
  isValid: boolean;
  error?: string;
} {
  if (!command || typeof command !== "object") {
    return { isValid: false, error: "Command must be an object" };
  }

  if (
    !command.name ||
    typeof command.name !== "string" ||
    command.name.trim().length === 0
  ) {
    return {
      isValid: false,
      error: "Command name is required and must be a non-empty string",
    };
  }

  if (command.name.length > 50) {
    return {
      isValid: false,
      error: "Command name must be 50 characters or less",
    };
  }

  if (!/^[a-zA-Z0-9\s\-_]+$/.test(command.name)) {
    return {
      isValid: false,
      error:
        "Command name can only contain letters, numbers, spaces, hyphens, and underscores",
    };
  }

  if (!command.searchPattern || typeof command.searchPattern !== "string") {
    return {
      isValid: false,
      error: "Search pattern is required and must be a string",
    };
  }

  if (
    command.replacement === undefined ||
    typeof command.replacement !== "string"
  ) {
    return {
      isValid: false,
      error: "Replacement must be a string (can be empty)",
    };
  }

  // Validate flag properties (all should be booleans if present)
  const flagProperties = ['global', 'ignoreCase', 'multiline', 'dotAll', 'unicode', 'sticky'];
  for (const flagProp of flagProperties) {
    if (command[flagProp] !== undefined && typeof command[flagProp] !== "boolean") {
      return {
        isValid: false,
        error: `${flagProp} must be a boolean value`
      };
    }
  }

  const flags = convertNamedFlagsToString(command);
  const regexValidation = validateRegexPattern(command.searchPattern, flags);
  if (!regexValidation.isValid) {
    return {
      isValid: false,
      error: `Invalid regex pattern: ${regexValidation.error}`,
    };
  }

  return { isValid: true };
}

export function getCustomCommands(): CustomCommand[] {
  const config = vscode.workspace.getConfiguration("stringManipulation");
  const customCommands = config.get<CustomCommand[]>("customCommands", []);

  const validCommands: CustomCommand[] = [];
  const invalidCommands: string[] = [];

  customCommands.forEach((command, index) => {
    const validation = validateCustomCommand(command);
    if (validation.isValid) {
      validCommands.push(command);
    } else {
      invalidCommands.push(`Command ${index + 1}: ${validation.error}`);
    }
  });

  if (invalidCommands.length > 0) {
    vscode.window.showWarningMessage(
      `Some custom string manipulation commands are invalid and will be ignored:\n\n${invalidCommands.join(
        "\n"
      )}`,
      { modal: false }
    );
  }

  return validCommands;
}

export function generateCommandId(commandName: string): string {
  return commandName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface CustomCommandQuickPickItem extends vscode.QuickPickItem {
  command: CustomCommand;
}

export async function showCustomCommandPicker(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.selections.length === 0) {
    vscode.window.showInformationMessage("No text selected");
    return;
  }

  const customCommands = getCustomCommands();
  
  if (customCommands.length === 0) {
    const choice = await vscode.window.showInformationMessage(
      "No custom commands configured. Would you like to open settings to add some?",
      "Open Settings",
      "Cancel"
    );
    
    if (choice === "Open Settings") {
      await vscode.commands.executeCommand("workbench.action.openSettings", "stringManipulation.customCommands");
    }
    return;
  }

  // Get the selected text for preview
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  // Create quick pick items
  const quickPickItems: CustomCommandQuickPickItem[] = customCommands.map((command) => {
    let preview: string | undefined;
    
    try {
      // Generate a preview if possible
      const commandFunc = createCustomRegexFunction(command);
      const firstLine = selectedText.split("\n")[0];
      const transformed = commandFunc(firstLine);
      
      // Truncate preview if it's too long
      if (transformed.length > 50) {
        preview = transformed.substring(0, 47) + "...";
      } else {
        preview = transformed;
      }
      
      // Only show preview if it's different from the original
      if (preview === firstLine) {
        preview = undefined;
      }
    } catch (error) {
      // Preview generation failed, that's okay
      preview = undefined;
    }

    // Create flags description
    const flags = convertNamedFlagsToString(command);
    const flagsDesc = flags === "g" ? "global" : flags.split("").map(f => {
      switch(f) {
        case "g": return "global";
        case "i": return "ignoreCase";
        case "m": return "multiline";
        case "s": return "dotAll";
        case "u": return "unicode";
        case "y": return "sticky";
        default: return f;
      }
    }).join(", ");

    return {
      label: command.name,
      description: preview ? `→ ${preview}` : undefined,
      detail: `/${command.searchPattern}/${flags} → "${command.replacement}" (${flagsDesc})`,
      command: command
    };
  });

  const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
    placeHolder: "Select a custom command to apply",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (selectedItem) {
    try {
      const commandFunc = createCustomRegexFunction(selectedItem.command);
      
      // Apply the transformation to all selections
      await editor.edit((builder) => {
        editor.selections.forEach((selection) => {
          const text = editor.document.getText(selection);
          const textParts = text.split("\n");
          const replaced = textParts.map((part) => commandFunc(part)).join("\n");
          builder.replace(selection, replaced);
        });
      });

      // Store the last action for repeat functionality
      const commandId = generateCommandId(selectedItem.command.name);
      context.globalState.update("lastAction", `custom-${commandId}`);
      
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to apply custom command "${selectedItem.command.name}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
