
const {
  window: { activeTextEditor: editor },
  commands
} = require('vscode');
const _string = require('underscore.string');
const apStyleTitleCase = require('ap-style-title-case');
const chicagoStyleTitleCase = require('chicago-capitalize');
const slugify = require('@sindresorhus/slugify');
const commandNames = [
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

const stringFunction = commandName => {
  if (!editor) { return; }

  editor.edit(builder => {
    let l = editor.selections.length;
    while (l--) {
      let selection = editor.selections[l];
      let replaced, stringFunc;
      const text = editor.document.getText(selection);
      const textParts = text.split('\n');

      switch (true) {
        case commandName.match('join'):
          replaced = _string[commandName](" ", ...textParts);
          builder.replace(selection, replaced);
          return;

        case commandName.match('camelize'):
          stringFunc = str => _string.camelize(str.toLowerCase());
          break;

        case commandName.match('screaming-snake'):
          stringFunc = str => _string.underscored(str)
            .replace(/([A-Z])[^A-Z]/g, " $1")
            .replace(/[^a-z]+/ig, " ")
            .trim()
            .replace(/\s/gi, '_')
            .toUpperCase();
          break;

        case commandName.match('slugify'):
          stringFunc = slugify;
          break;

        case commandName.match(/case$/):
          stringFunc = _string[commandName];
          break;

        case commandName.match('titleize-ap-style'):
          stringFunc = apStyleTitleCase;
          break;

        case commandName.match('titleize-chicago-style'):
          stringFunc = chicagoStyleTitleCase;
          break;

        default:
          stringFunc = (str) => _string[commandName](str.toLowerCase());
          break;
      }

      replaced = textParts.reduce((prev, curr) => prev.push(stringFunc(curr)) && prev, []).join('\n');
      builder.replace(selection, replaced);
    }
  })
}

exports.activate = context => {
  commandNames.forEach(commandName => {
    context.subscriptions.push(commands.registerCommand(`string-manipulation.${commandName}`, () => stringFunction(commandName)));
  });
}
