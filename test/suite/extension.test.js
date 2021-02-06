const assert = require("assert");
const { test, suite } = require("mocha");

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
const myExtension = require("../../extension");

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");
  const tests = [
    ["camelize", "moz-transform", "mozTransform"],
    ["camelize", "-moz-transform", "MozTransform"],
    ["capitalize", "foo Bar", "Foo Bar"],
    ["clean", " foo    bar   ", "foo bar"],
    ["cleanDiacritics", "ääkkönen", "aakkonen"],
    ["sentence", "foo Bar", "Foo bar"],
    ["classify", "some_class_name", "SomeClassName"],
    ["dasherize", "MozTransform", "-moz-transform"],
    ["decapitalize", "Foo Bar", "foo Bar"],
    [
      "humanize",
      "  capitalize dash-CamelCase_underscore trim  ",
      "Capitalize dash camel case underscore trim",
    ],
    ["reverse", "Abc", "cbA"],
    ["slugify", "Un éléphant à l'orée du bois", "un-elephant-a-l-oree-du-bois"],
    ["swapCase", "HELLOworld", "helloWORLD"],
    ["snake", "This-is_snake case", "this_is_snake_case"],
    ["screamingSnake", "screaming-snake case", "SCREAMING_SNAKE_CASE"],
    ["titleize", "my name is tristan", "My Name Is Tristan"],
    ["titleizeApStyle", "this is a test", "This Is a Test"],
    [
      "titleizeChicagoStyle",
      "The quick brown fox jumps over the lazy dog.",
      "The Quick Brown Fox Jumps Over the Lazy Dog.",
    ],
    [
      "underscored",
      "Underscored-is-like  snake-case",
      "underscored_is_like_snake_case",
    ],
    ["chop", "aabbccdd", "aa,bb,cc,dd", { functionArg: 2 }],
    ["truncate", "aabbccdd", "aabb...", { functionArg: 4 }],
    ["prune", "aabbccddaabbccdd", "aabbc...", { functionArg: 8 }],
    ["repeat", "aabbccdd", "aabbccddaabbccdd", { functionArg: 2 }],
    [
      "increment",
      "a1 b2 c3 4d 5e 6f 12x y23 34z45",
      "a2 b3 c4 5d 6e 7f 13x y24 35z46",
    ],
    [
      "increment",
      "a1 b2 c3 4d 5e\n6f 12x y23 34z45",
      "a2 b3 c4 5d 6e\n7f 13x y24 35z46",
    ],
    [
      "increment",
      "a-4 b-3 c-2 -1d 0e\n6f 12x y23 34z45",
      "a-3 b-2 c-1 0d 1e\n7f 13x y24 35z46",
    ],
    [
      "decrement",
      "a1 b2 c3 4d 5e 6f 12x y23 34z45",
      "a0 b1 c2 3d 4e 5f 11x y22 33z44",
    ],
    [
      "decrement",
      "a1 b2 c3 4d\n5e 6f 12x y23 34z45",
      "a0 b1 c2 3d\n4e 5f 11x y22 33z44",
    ],
    [
      "decrement",
      "a-3 b-2 c-1 0d\n1e 6f 12x y23 34z45",
      "a-4 b-3 c-2 -1d\n0e 5f 11x y22 33z44",
    ],
    [
      "duplicateAndIncrement",
      "a1 b2 c3 4d 5e 6f 12x y23 34z45\n",
      "a1 b2 c3 4d 5e 6f 12x y23 34z45\na2 b3 c4 5d 6e 7f 13x y24 35z46\n",
    ],
    [
      "duplicateAndDecrement",
      "a1 b2 c3 4d 5e 6f 12x y23 34z45\n",
      "a1 b2 c3 4d 5e 6f 12x y23 34z45\na0 b1 c2 3d 4e 5f 11x y22 33z44\n",
    ],
    [
      "sequence",
      "a1 b2 c3 4d 5e 6f 12x y23 34z45",
      "a1 b2 c3 4d 5e 6f 7x y8 9z10",
    ],
    [
      "sequence",
      "a14 b2 c3\n4d 5e 6f 7x y8 9z12",
      "a14 b15 c16\n17d 18e 19f 20x y21 22z23",
    ],
    ["sequence", "-3 4 5 6 7", "-3 -2 -1 0 1"],
  ];
  suite("commandNameFunctionMap outputs correctly for all methods", () => {
    tests.forEach(
      ([funcName, originalString, expectedString, { functionArg } = {}]) => {
        test(`${funcName} returns ${expectedString} when called with ${originalString}`, () => {
          const func = functionArg
            ? myExtension.commandNameFunctionMap[funcName](functionArg)
            : myExtension.commandNameFunctionMap[funcName];
          assert.equal(func(originalString), expectedString);
        });
      }
    );
  });
});
