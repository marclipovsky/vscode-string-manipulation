const {
  window: { activeTextEditor: editor },
  commands: { registerCommand }
} = require('vscode');
const _string = require('underscore.string');
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
  if (!_string[commandName] || !editor) { return; }

  editor.edit(builder => {
    editor.selections.forEach(selection => {
      let replaced;
      const text = editor.document.getText(selection);
      const textParts = text.split('\n');


      if (commandName === 'join') {
        replaced = _string[commandName](" ", ...textParts);
      } else {
        replaced = textParts.reduce((prev, curr) => prev.push(_string[commandName](curr)) && prev, []).join('\n');
      }

      builder.replace(selection, replaced);
    });
  })
}

exports.activate = function activate(context) {
  commands.forEach(commandName => {
    context.subscriptions.push(registerCommand(`string-manipulation.${commandName}`, () => holder(commandName)));
  })
}

exports.deactivate = function deactivate() { };