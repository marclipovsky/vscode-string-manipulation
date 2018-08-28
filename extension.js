
const {
  window: { activeTextEditor: editor },
  commands
} = require('vscode');
const _string = require('underscore.string');
const apStyleTitleCase = require('ap-style-title-case');
const chicagoStyleTitleCase = require('chicago-capitalize');
const slugify = require('@sindresorhus/slugify');
const defaultFunction = commandName => str => _string[commandName](str.toLowerCase());

const commandNameFunctionMap = {
  'titleize': defaultFunction('titleize'),
  'classify': defaultFunction('classify'),
  'underscored': defaultFunction('underscored'),
  'dasherize': defaultFunction('dasherize'),
  'humanize': defaultFunction('humanize'),
  'reverse': defaultFunction('reverse'),
  'decapitalize': defaultFunction('decapitalize'),
  'capitalize': defaultFunction('capitalize'),
  'camelize': str => _string.camelize(str.match(/[a-z]/) ? str : str.toLowerCase()),
  'slugify': slugify,
  'swapCase': _string['swapCase'],
  'screaming-snake': str => _string.underscored(str)
    .replace(/([A-Z])[^A-Z]/g, ' $1')
    .replace(/[^a-z]+/ig, ' ')
    .trim()
    .replace(/\s/gi, '_')
    .toUpperCase(),
  'titleize-ap-style': apStyleTitleCase,
  'titleize-chicago-style': chicagoStyleTitleCase,
}


const stringFunction = commandName => {
  if (!editor) { return; }

  editor.edit(builder => {
    let l = editor.selections.length;
    while (l--) {
      let selection = editor.selections[l];
      const text = editor.document.getText(selection);
      const textParts = text.split('\n');
      const stringFunc = commandNameFunctionMap[commandName];
      const replaced = textParts.reduce((prev, curr) =>
        prev.push(stringFunc(curr)) && prev, []).join('\n');

      builder.replace(selection, replaced);
    }
  }, () => {});
}

exports.activate = context => {
  Object.keys(commandNameFunctionMap).forEach(commandName => {
    context.subscriptions.push(commands.registerCommand(`string-manipulation.${commandName}`, () => stringFunction(commandName)));
  });
}
