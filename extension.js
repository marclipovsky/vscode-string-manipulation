const {
  window: { activeTextEditor: editor },
  commands: { registerCommand }
} = require('vscode');
const string = require('underscore.string');
const apStyleTitleCase = require('ap-style-title-case');
const chicagoStyleTitleCase = require('chicago-capitalize');
const commands = [
  "titleize",
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
  "capitalize",
  "titleize-ap-style",
  "titleize-chicago-style",
];

const holder = commandName => {
  if (!editor) { return; }

  editor.edit(builder => {
    editor.selections.forEach(selection => {
      let replaced, stringFunc;
      const text = editor.document.getText(selection);
      const textParts = text.split('\n');

      switch (commandName) {
        case 'join':
          replaced = string[commandName](" ", ...textParts);
          builder.replace(selection, replaced);
          return;

        case 'titleize-ap-style':
          stringFunc = apStyleTitleCase;
          break;

        case 'titleize-chicago-style':
          stringFunc = chicagoStyleTitleCase;
          break;
      
        default:
          stringFunc = string[commandName];
          break;
      }

      replaced = textParts.reduce((prev, curr) => prev.push(stringFunc(curr)) && prev, []).join('\n');
      builder.replace(selection, replaced);
    });
  })
}

exports.activate = context => {
  commands.forEach(commandName => {
    context.subscriptions.push(registerCommand(`string-manipulation.${commandName}`, () => holder(commandName)));
  })
}

exports.deactivate = () => { };