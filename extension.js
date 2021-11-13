const vscode = require("vscode");
const _string = require("underscore.string");
const apStyleTitleCase = require("ap-style-title-case");
const chicagoStyleTitleCase = require("chicago-capitalize");
const slugify = require("@sindresorhus/slugify");
const defaultFunction = (commandName, option) => (str) =>
  _string[commandName](str, option);
const leftPadZero = (num, digits, trim) => {
  let text = ((num == null) || isNaN(num)) ? "" : (num + "");
  let paddingLength = (digits - text.length);
  return (paddingLength > 0) 
    ? ("0".repeat(paddingLength) + text)
    : (trim ? text.substr(paddingLength, length) : text)
  ;
};
const sequencePartly = (str, initial, textLength, withZero) => {
  str = str.replace(/-?\d+/g, (n) => {
    if (initial == null) {
      initial = Number(n);
    }
    if (isNaN(initial)) {
      initial = 1;
    }
    if (textLength == null) {
      textLength = n.length;
    }
    if (isNaN(textLength) || (textLength <= 0)) {
      textLength = 1;
    }
    return withZero ? leftPadZero(initial ++, textLength) : initial ++;
  });
  return { str, initial, textLength };
};
const sequence = (str) => sequencePartly(str).str;
const sequenceWithZeroPartly = (str, initial, textLength) => sequencePartly(str, initial, textLength, true);
const sequenceWithZero = (str) => sequenceWithZeroPartly(str).str;
const increment = (str, duplicate) => str.replace(/-?\d+/g, (n) => { let result = Number(n) + 1; return duplicate ? n + result : result; });
const decrement = (str, duplicate) => str.replace(/-?\d+/g, (n) => { let result = Number(n) - 1; return duplicate ? n + result : result; });
const incrementWithZero = (str, duplicate) => str.replace(/-?\d+/g, (n) => { let result = leftPadZero(Number(n) + 1, n.length); return duplicate ? n + result : result});
const decrementWithZero = (str, duplicate) => str.replace(/-?\d+/g, (n) => { let result = leftPadZero(Number(n) - 1, n.length); return duplicate ? n + result : result});

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
  screamingSnake: (str) =>
    _string
      .underscored(str)
      .replace(/([A-Z])[^A-Z]/g, " $1")
      .replace(/[^a-z]+/gi, " ")
      .trim()
      .replace(/\s/gi, "_")
      .toUpperCase(),
  titleizeApStyle: apStyleTitleCase,
  titleizeChicagoStyle: chicagoStyleTitleCase,
  truncate: (n) => defaultFunction("truncate", n),
  prune: (n) => (str) => str.slice(0, n - 3).trim() + "...",
  repeat: (n) => defaultFunction("repeat", n),
  increment,
  decrement,
  duplicateAndIncrement: (str) => str + increment(str),
  duplicateAndDecrement: (str) => str + decrement(str),
  duplicateNumAndIncrement: (str) => increment(str, true),
  duplicateNumAndDecrement: (str) => decrement(str, true),
  incrementWithZero,
  decrementWithZero,
  duplicateAndIncrementWithZero: (str) => str + incrementWithZero(str),
  duplicateAndDecrementWithZero: (str) => str + decrementWithZero(str),
  duplicateNumAndIncrementWithZero: (str) => incrementWithZero(str, true),
  duplicateNumAndDecrementWithZero: (str) => decrementWithZero(str, true),
  sequence,
  sequencePartly,
  sequenceWithZero,
  sequenceWithZeroPartly,
};
const numberFunctionNames = [
  "increment",
  "decrement",
  "sequence",
  "duplicateAndIncrement",
  "duplicateAndDecrement",
];
const functionNamesWithArgument = ["chop", "truncate", "prune", "repeat"];

const stringFunction = async (commandName) => {
  const editor = vscode.window.activeTextEditor;
  const selectionInfos =[];
  if (!editor) return;
  
  // Sepacial treatment for sequence/sequenceWithZero function
  if ([commandNameFunctionMap.sequence.name, commandNameFunctionMap.sequenceWithZero.name].includes(commandName)) {
    let temp = { initial: null, textLength: null };
    editor.selections.forEach((selection, index) => {
      let text = editor.document.getText(selection);
      temp.initial = (index == 0) ? (Number(text) || temp.initial) : temp.initial;
      
      let result = commandNameFunctionMap[commandName + "Partly"](text, temp.initial, temp.textLength);
      Object.assign(temp, result);
      selectionInfos.push({ selection: selection, replaced: result.str });
    });
    
  // Other commands
  } else {
    editor.selections.forEach(async (selection) => {
      const text = editor.document.getText(selection);
      const textParts = text.split("\n");
      let stringFunc, replaced;
      
      if (functionNamesWithArgument.includes(commandName)) {
        const value = await vscode.window.showInputBox();
        stringFunc = commandNameFunctionMap[commandName](value);
        replaced = textParts
          .reduce((prev, curr) => prev.push(stringFunc(curr)) && prev, [])
          .join("\n");
      } else if (numberFunctionNames.includes(commandName)) {
        replaced = commandNameFunctionMap[commandName](text);
      } else {
        stringFunc = commandNameFunctionMap[commandName];
        replaced = textParts
          .reduce((prev, curr) => prev.push(stringFunc(curr)) && prev, [])
          .join("\n");
      }
      selectionInfos.push({ selection, replaced });
    });
    
  }
  
  editor.edit((builder) => {
    selectionInfos.forEach(info => {
      builder.replace(info.selection, info.replaced);
    });
  });
};

const activate = (context) => {
  Object.keys(commandNameFunctionMap).forEach((commandName) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `string-manipulation.${commandName}`,
        () => stringFunction(commandName)
      )
    );
  });
};

exports.activate = activate;

module.exports = {
  activate,
  commandNameFunctionMap,
};
