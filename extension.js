const vscode = require("vscode");
const _string = require("underscore.string");
const apStyleTitleCase = require("ap-style-title-case");
const chicagoStyleTitleCase = require("chicago-capitalize");
const slugify = require("@sindresorhus/slugify");
const defaultFunction = (commandName, option) => (str) =>
  _string[commandName](str, option);

const commandNameFunctionMap = {
  titleize: defaultFunction("titleize"),
  chop: (n) => defaultFunction("chop", n),
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
  camelize: (str) =>
    _string.camelize(str.match(/[a-z]/) ? str : str.toLowerCase()),
  slugify: slugify,
  swapCase: defaultFunction("swapCase"),
  snake: (str) =>
    _string
      .underscored(str)
      .replace(/([A-Z])[^A-Z]/g, " $1")
      .replace(/[^a-z]+/gi, " ")
      .trim()
      .replace(/\s/gi, "_"),
  "screaming-snake": (str) =>
    _string
      .underscored(str)
      .replace(/([A-Z])[^A-Z]/g, " $1")
      .replace(/[^a-z]+/gi, " ")
      .trim()
      .replace(/\s/gi, "_")
      .toUpperCase(),
  "titleize-ap-style": apStyleTitleCase,
  "titleize-chicago-style": chicagoStyleTitleCase,
  truncate: (n) => defaultFunction("truncate", n),
  prune: (n) => defaultFunction("prune", n),
  repeat: (n) => defaultFunction("repeat", n),
};

const stringFunction = (commandName) => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  editor.edit(
    async (builder) => {
      let l = editor.selections.length;
      while (l--) {
        let selection = editor.selections[l];
        const text = editor.document.getText(selection);
        const textParts = text.split("\n");
        let stringFunc, replaced;

        if (["chop", "truncate", "prune", "repeat"].includes(commandName)) {
          const value = await vscode.window.showInputBox();
          stringFunc = commandNameFunctionMap[commandName](value);
          replaced = textParts
            .reduce((prev, curr) => prev.push(stringFunc(curr)) && prev, [])
            .join("\n");
        } else {
          stringFunc = commandNameFunctionMap[commandName];
          replaced = textParts
            .reduce((prev, curr) => prev.push(stringFunc(curr)) && prev, [])
            .join("\n");
        }

        builder.replace(selection, replaced);
      }
    },
    () => {}
  );
};

function activate(context) {
  Object.keys(commandNameFunctionMap).forEach((commandName) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `string-manipulation.${commandName}`,
        () => stringFunction(commandName)
      )
    );
  });
}

exports.activate = activate;

module.exports = {
  activate,
  commandNameFunctionMap,
};
