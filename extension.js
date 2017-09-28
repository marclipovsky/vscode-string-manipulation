const {
  window: { activeTextEditor: editor },
  commands: { registerCommand }
} = require('vscode');
const _string = require('underscore.string');
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
  "screaming-snake",
  "titleize-ap-style",
  "titleize-chicago-style",
];

const holder = commandName => {
  if (!editor) { return; }

  editor.edit(builder => {
    let l = editor.selections.length;
    while (l--) {
      let selection = editor.selections[l];
      let replaced, stringFunc;
      const text = editor.document.getText(selection);
      const textParts = text.split('\n');

      switch (commandName) {
        case 'join':
          replaced = _string[commandName](" ", ...textParts);
          builder.replace(selection, replaced);
          return;

        case 'screaming-snake':
          stringFunc = str => _string.underscored(str)
            .replace(/([A-Z])[^A-Z]/g, " $1")
            .replace(/[^a-z]+/ig, " ")
            .trim()
            .replace(/\s/gi, '_')
            .toUpperCase();
          break;

        case 'titleize-ap-style':
          stringFunc = apStyleTitleCase;
          break;

        case 'titleize-chicago-style':
          stringFunc = chicagoStyleTitleCase;
          break;

        default:
          stringFunc = _string[commandName];
          break;
      }

      replaced = textParts.reduce((prev, curr) => prev.push(stringFunc(curr)) && prev, []).join('\n');
      builder.replace(selection, replaced);
    }
  })
}

exports.activate = context => {
  commands.forEach(commandName => {
    context.subscriptions.push(registerCommand(`string-manipulation.${commandName}`, () => holder(commandName)));
  })
}

exports.deactivate = () => { };
