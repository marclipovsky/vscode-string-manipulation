const vscode = require("vscode");
const _string = require("underscore.string");
const apStyleTitleCase = require("ap-style-title-case");
const chicagoStyleTitleCase = require("chicago-capitalize");
const slugify = require("@sindresorhus/slugify");
const _stringFunc = (commandName, option) => (str) =>
  _string[commandName](str, option);

const commandNameFunctionMap = {
  titleize: _stringFunc("titleize"),
  chop: (str) => _stringFunc("chop", str),
  classify: _stringFunc("classify"),
  clean: _stringFunc("clean"),
  cleanDiacritics: _stringFunc("cleanDiacritics"),
  underscored: _stringFunc("underscored"),
  dasherize: _stringFunc("dasherize"),
  humanize: _stringFunc("humanize"),
  reverse: _stringFunc("reverse"),
  decapitalize: _stringFunc("decapitalize"),
  capitalize: _stringFunc("capitalize"),
  sentence: _stringFunc("capitalize", true),
  camelize: (str) =>
    _string.camelize(str.match(/[a-z]/) ? str : str.toLowerCase()),
  slugify: slugify,
  swapCase: _stringFunc("swapCase"),
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
  truncate: (str) => _stringFunc("truncate", str),
  prune: (str) => _stringFunc("prune", str),
  repeat: (str) => _stringFunc("repeat", str),
  sequence: (str, num) => {
    let newNum;
    const string = str.replace(/[0-9]+/g, (n) => {
      num = typeof num === "number" ? num + 1 : Number(n);
      newNum = num;
      return num;
    });
    return {
      str: string,
      num: newNum,
    };
  },
  increment: (str) => str.replace(/[0-9]+/g, (n) => Number(n) + 1),
  decrement: (str) => str.replace(/[0-9]+/g, (n) => Number(n) - 1),
  copyAndIncrement: (str) => str + str.replace(/[0-9]+/g, (n) => Number(n) + 1),
  copyAndDecrement: (str) => str + str.replace(/[0-9]+/g, (n) => Number(n) - 1),
  escape,
  unescape,
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
        let stringFunc, replaced, initSequenceNumber;

        if (["chop", "truncate", "prune", "repeat"].includes(commandName)) {
          const value = await vscode.window.showInputBox();
          stringFunc = commandNameFunctionMap[commandName](value);
          replaced = textParts
            .reduce((prev, curr) => prev.push(stringFunc(curr)) && prev, [])
            .join("\n");
        } else if (["sequence"].includes(commandName)) {
          stringFunc = commandNameFunctionMap[commandName];
          replaced = textParts.reduce(
            (prev, curr) => {
              const { str, n } = stringFunc(curr, prev.num);
              prev.str.push(str);
              prev.num = n;
              return prev;
            },
            {
              str: [],
              num: null,
            }
          );
          replaced.str.join("\n");
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
