const vscode = require('vscode');
const string = require('underscore.string');
const editor = vscode.window.activeTextEditor;
const commands = [
  "titlize",
  "camelize",
  "classify",
  "underscored",
  "dasherize",
  "humanize",
  "slugify",
  "reverse",
  "swapCase",
  "join",
  "decapitalize",
  "capitalize"
];

function holder(commandName) {
  if (!string[commandName] || !editor) { return; }

  editor.edit(builder => {
    editor.selections.forEach(selection => {
      let text, replaced;
      text = editor.document.getText(selection);

      if (commandName === 'join') {
        replaced = string[commandName](" ", ...text.split("\n"));
      } else {
        replaced = string[commandName](text);
      }

      builder.replace(selection, replaced);
    });
  })
}

exports.activate = function activate(context) {
  commands.forEach(commandName => {
    context.subscriptions.push(vscode.commands.registerCommand(`string-manipulation.${commandName}`, _ => holder(commandName)));
  })
}

exports.deactivate = function deactivate() { }