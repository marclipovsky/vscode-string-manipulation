import * as vscode from "vscode";
import { StringManipulationSidebar } from "./sidebar";
import { activate as stringManipulationActivate } from "./commands/index";
import { registerPreviewCommand } from "./commands/preview";

export function activate(context: vscode.ExtensionContext) {
  stringManipulationActivate(context);

  // Register command to show transformations with previews
  registerPreviewCommand(context);

  const sidebarProvider = new StringManipulationSidebar(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      StringManipulationSidebar.viewType,
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Update the sidebar initially
  sidebarProvider.updateWebview();
}

export function deactivate() {}
