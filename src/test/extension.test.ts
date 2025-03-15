import * as assert from "assert";
import { afterEach, beforeEach, suite, test } from "mocha";
import * as path from "path";
import * as vscode from "vscode";
import { CommandFunction, commandNameFunctionMap } from "../commands/index";

type StringTransformationTest = [
  funcName: string,
  originalString: string,
  expectedString: string,
  options?: {
    multiselectData?: {
      offset: number;
    };
    functionArg?: number;
  }
];

let editor: vscode.TextEditor;
let document: vscode.TextDocument;
const originalShowInputBox = vscode.window.showInputBox;
const stripNewlines = (str: string) => str.replace(/[\n\r]/g, "");

suite("Extension Test Suite", () => {
  beforeEach(async () => {
    // Arrange: Open a text document before each test
    const uri = vscode.Uri.file(path.join(__dirname, "../../content.txt"));
    document = await vscode.workspace.openTextDocument(uri);
    editor = await vscode.window.showTextDocument(document);
  });

  afterEach(async () => {
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    vscode.window.showInputBox = originalShowInputBox;
  });

  let getTextForSelectionsByCommand = async (
    commandName: string,
    ranges: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    }[]
  ): Promise<string[]> => {
    editor.selections = ranges.map((range) => {
      const startPos = new vscode.Position(
        range.start.line,
        range.start.character
      );
      const endPos = new vscode.Position(range.end.line, range.end.character);
      return new vscode.Selection(startPos, endPos);
    });
    await vscode.commands.executeCommand(commandName);
    return Promise.resolve(
      editor.selections.map((selection) =>
        stripNewlines(editor.document.getText(selection))
      )
    );
  };

  suite("activation events", () => {
    const extension = vscode.extensions.getExtension(
      "marclipovsky.string-manipulation"
    )!;

    test("is not active by default", () => {
      assert.equal(false, extension.isActive);
    });

    test("activates when running one of the commands", async () => {
      await vscode.commands.executeCommand("string-manipulation.titleize");
      assert.equal(true, extension.isActive);
    });
  });

  suite("commands", () => {
    test("camelize converts hyphenated strings to camelCase", async () => {
      const [output1, output2] = await getTextForSelectionsByCommand(
        "string-manipulation.camelize",
        [
          { start: { line: 0, character: 0 }, end: { line: 0, character: 14 } },
          { start: { line: 1, character: 0 }, end: { line: 1, character: 15 } },
        ]
      );

      assert.strictEqual(output1 /* moz-transform */, "mozTransform");
      assert.strictEqual(output2 /* -moz-transform */, "MozTransform");
    });

    test("capitalize capitalizes the first character of each selection", async () => {
      const [output1, output2] = await getTextForSelectionsByCommand(
        "string-manipulation.capitalize",
        [
          { start: { line: 2, character: 0 }, end: { line: 2, character: 3 } },
          { start: { line: 2, character: 4 }, end: { line: 2, character: 8 } },
        ]
      );

      assert.strictEqual(output1 /* foo */, "Foo");
      assert.strictEqual(output2 /* Bar */, "Bar");
    });

    test("clean collapses multiple spaces into one", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.clean",
        [{ start: { line: 3, character: 0 }, end: { line: 3, character: 15 } }]
      );

      assert.strictEqual(output /* foo    bar */, "foo bar");
    });

    test("cleanDiacritics removes diacritic marks from characters", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.cleanDiacritics",
        [{ start: { line: 4, character: 0 }, end: { line: 4, character: 8 } }]
      );

      assert.strictEqual(output /* ääkkönen */, "aakkonen");
    });

    test("sentence transforms text to sentence case", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.sentence",
        [{ start: { line: 5, character: 0 }, end: { line: 5, character: 7 } }]
      );

      assert.strictEqual(output /* foo Bar */, "Foo bar");
    });

    test("classify converts underscored text to PascalCase", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.classify",
        [{ start: { line: 6, character: 0 }, end: { line: 6, character: 15 } }]
      );

      assert.strictEqual(output /* some_class_name */, "SomeClassName");
    });

    test("dasherize converts camelCase to kebab-case", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.dasherize",
        [{ start: { line: 7, character: 0 }, end: { line: 7, character: 12 } }]
      );

      assert.strictEqual(output /* MozTransform */, "-moz-transform");
    });

    test("decapitalize lowercases the first character of each selection", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.decapitalize",
        [{ start: { line: 8, character: 0 }, end: { line: 8, character: 7 } }]
      );

      assert.strictEqual(output /* Foo Bar */, "foo Bar");
    });

    test("humanize converts text to human-readable form", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.humanize",
        [{ start: { line: 9, character: 0 }, end: { line: 9, character: 45 } }]
      );

      assert.strictEqual(
        output /*   capitalize dash-CamelCase_underscore trim */,
        "Capitalize dash camel case underscore trim"
      );
    });

    test("reverse reverses the characters in the selection", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.reverse",
        [{ start: { line: 10, character: 0 }, end: { line: 10, character: 3 } }]
      );

      assert.strictEqual(output /* Abc */, "cbA");
    });

    test("slugify converts text to a URL-friendly slug", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.slugify",
        [
          {
            start: { line: 11, character: 0 },
            end: { line: 11, character: 28 },
          },
        ]
      );

      assert.strictEqual(
        output /* Un éléphant à l'orée du bois */,
        "un-elephant-a-l-oree-du-bois"
      );
    });

    test("swapCase inverts the case of each character", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.swapCase",
        [
          {
            start: { line: 12, character: 0 },
            end: { line: 12, character: 10 },
          },
        ]
      );

      assert.strictEqual(output /* HELLOworld */, "helloWORLD");
    });

    test("snake converts text to snake_case", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.snake",
        [
          {
            start: { line: 13, character: 0 },
            end: { line: 13, character: 18 },
          },
        ]
      );

      assert.strictEqual(output /* This-is_snake case */, "this_is_snake_case");
    });

    test("screamingSnake converts text to SCREAMING_SNAKE_CASE", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.screamingSnake",
        [
          {
            start: { line: 14, character: 0 },
            end: { line: 14, character: 20 },
          },
        ]
      );

      assert.strictEqual(
        output /* screaming-snake case */,
        "SCREAMING_SNAKE_CASE"
      );
    });

    test("titleize capitalizes the first letter of each word", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.titleize",
        [
          {
            start: { line: 15, character: 0 },
            end: { line: 15, character: 18 },
          },
        ]
      );

      assert.strictEqual(output /* my name is tristan */, "My Name Is Tristan");
    });

    test("titleizeApStyle capitalizes titles according to AP style", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.titleizeApStyle",
        [
          {
            start: { line: 16, character: 0 },
            end: { line: 16, character: 14 },
          },
        ]
      );

      assert.strictEqual(output /* this is a test */, "This Is a Test");
    });

    test("titleizeChicagoStyle capitalizes titles according to Chicago style", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.titleizeChicagoStyle",
        [
          {
            start: { line: 17, character: 0 },
            end: { line: 17, character: 44 },
          },
        ]
      );

      assert.strictEqual(
        output /* The quick brown fox jumps over the lazy dog. */,
        "The Quick Brown Fox Jumps Over the Lazy Dog."
      );
    });

    suite("underscore", () => {
      test("converts text to underscore_case", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.underscored",
          [
            {
              start: { line: 18, character: 0 },
              end: { line: 18, character: 31 },
            },
          ]
        );

        assert.strictEqual(
          output /* Underscored-is-like  snake-case */,
          "underscored_is_like_snake_case"
        );
      });

      test("removes special characters and converts text to lowercase with underscores", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.underscored",
          [
            {
              start: { line: 52, character: 0 },
              end: { line: 52, character: 25 },
            },
          ]
        );

        assert.strictEqual(
          output /* "My name's %20 Minalike!" */,
          "my_name_s_20_minalike"
        );
      });
    });

    test("chop splits the string into chunks of given length", async () => {
      vscode.window.showInputBox = async () => {
        return "2";
      };

      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.chop",
        [
          {
            start: { line: 19, character: 0 },
            end: { line: 19, character: 8 },
          },
        ]
      );

      assert.strictEqual(output /* aabbccdd */, "aa,bb,cc,dd");
    });

    test("truncate shortens the string to specified length and adds ellipsis", async () => {
      vscode.window.showInputBox = async () => {
        return "4";
      };

      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.truncate",
        [
          {
            start: { line: 20, character: 0 },
            end: { line: 20, character: 8 },
          },
        ]
      );

      assert.strictEqual(output /* aabbccdd */, "aabb...");
    });

    test("prune truncates the string without breaking words", async () => {
      vscode.window.showInputBox = async () => {
        return "8";
      };

      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.prune",
        [
          {
            start: { line: 21, character: 0 },
            end: { line: 21, character: 16 },
          },
        ]
      );

      assert.strictEqual(output /* aabbccddaabbccdd */, "aabbc...");
    });

    test("repeat duplicates the string given number of times", async () => {
      vscode.window.showInputBox = async () => {
        return "2";
      };

      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.repeat",
        [
          {
            start: { line: 22, character: 0 },
            end: { line: 22, character: 8 },
          },
        ]
      );

      assert.strictEqual(output /* aabbccdd */, "aabbccddaabbccdd");
    });

    test("increment increases all numbers in the selection by 1", async () => {
      const [output1, output2, output3] = await getTextForSelectionsByCommand(
        "string-manipulation.increment",
        [
          {
            start: { line: 23, character: 0 },
            end: { line: 23, character: 31 },
          },
          {
            start: { line: 24, character: 0 },
            end: { line: 25, character: 16 },
          },
          {
            start: { line: 26, character: 0 },
            end: { line: 27, character: 16 },
          },
        ]
      );

      assert.strictEqual(
        output1 /* a1 b2 c3 4d 5e 6f 12x y23 34z45 */,
        "a2 b3 c4 5d 6e 7f 13x y24 35z46"
      );
      assert.strictEqual(
        output2 /* a1 b2 c3 4d 5e\n6f 12x y23 34z45 */,
        "a2 b3 c4 5d 6e7f 13x y24 35z46"
      );
      assert.strictEqual(
        output3 /* a-4 b-3 c-2 -1d 0e\n6f 12x y23 34z45 */,
        "a-3 b-2 c-1 0d 1e7f 13x y24 35z46"
      );
    });

    test("decrement decreases all numbers in the selection by 1", async () => {
      const [output1, output2, output3] = await getTextForSelectionsByCommand(
        "string-manipulation.decrement",
        [
          {
            start: { line: 28, character: 0 },
            end: { line: 28, character: 31 },
          },
          {
            start: { line: 29, character: 0 },
            end: { line: 30, character: 19 },
          },
          {
            start: { line: 31, character: 0 },
            end: { line: 32, character: 19 },
          },
        ]
      );

      assert.strictEqual(
        output1 /* a1 b2 c3 4d 5e 6f 12x y23 34z45 */,
        "a0 b1 c2 3d 4e 5f 11x y22 33z44"
      );
      assert.strictEqual(
        output2 /* a1 b2 c3 4d\n5e 6f 12x y23 34z45 */,
        "a0 b1 c2 3d4e 5f 11x y22 33z44"
      );
      assert.strictEqual(
        output3 /* a-3 b-2 c-1 0d\n1e 6f 12x y23 34z45 */,
        "a-4 b-3 c-2 -1d0e 5f 11x y22 33z44"
      );
    });

    test("incrementFloat increases all floats in the selection by 1", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.incrementFloat",
        [
          {
            start: { line: 53, character: 0 },
            end: { line: 53, character: 64 },
          },
        ]
      );

      assert.strictEqual(
        output /* Lorem -1.234 ipsum 5.678 dolor sit amet, consectetur adipiscing. */,
        "Lorem -1.233 ipsum 5.679 dolor sit amet, consectetur adipiscing."
      );
    });

    test("decrementFloat decreases all floats in the selection by 1", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.decrementFloat",
        [
          {
            start: { line: 54, character: 0 },
            end: { line: 54, character: 53 },
          },
        ]
      );

      assert.strictEqual(
        output /* Sed do 9.876 eiusmod -4.321 tempor incididunt labore. */,
        "Sed do 9.875 eiusmod -4.322 tempor incididunt labore."
      );
    });

    test("duplicateAndIncrement duplicates selection and increments numbers in duplicate", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.duplicateAndIncrement",
        [
          {
            start: { line: 33, character: 0 },
            end: { line: 34, character: 0 },
          },
        ]
      );

      assert.strictEqual(
        output,
        /* a1 b2 c3 4d 5e 6f 12x y23 34z45\n */ "a2 b3 c4 5d 6e 7f 13x y24 35z46"
      );
    });

    test("duplicateAndDecrement duplicates selection and decrements numbers in duplicate", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.duplicateAndDecrement",
        [
          {
            start: { line: 35, character: 0 },
            end: { line: 36, character: 0 },
          },
        ]
      );

      assert.strictEqual(
        output,
        /* a1 b2 c3 4d 5e 6f 12x y23 34z45\n */ "a0 b1 c2 3d 4e 5f 11x y22 33z44"
      );
    });

    test("sequence replaces numbers with a sequence starting from 1", async () => {
      const [output1, output2] = await getTextForSelectionsByCommand(
        "string-manipulation.sequence",
        [
          {
            start: { line: 37, character: 0 },
            end: { line: 37, character: 31 },
          },
          {
            start: { line: 38, character: 0 },
            end: { line: 39, character: 20 },
          },
        ]
      );

      assert.strictEqual(
        output1 /* a1 b2 c3 4d 5e 6f 12x y23 34z45 */,
        "a1 b2 c3 4d 5e 6f 7x y8 9z10"
      );
      assert.strictEqual(
        output2 /* a14 b2 c3\n4d 5e 6f 7x y8 9z12 */,
        "a11 b12 c1314d 15e 16f 17x y18 19z20"
      );
    });

    test("utf8ToChar converts Unicode escapes to characters", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.utf8ToChar",
        [
          {
            start: { line: 40, character: 0 },
            end: { line: 40, character: 49 },
          },
        ]
      );

      assert.strictEqual(
        output /* \u0061\u0062\u0063\u4e2d\u6587\ud83d\udc96 */,
        "abc中文💖"
      );
    });

    test("charToUtf8 converts characters to Unicode escapes", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.charToUtf8",
        [
          {
            start: { line: 41, character: 0 },
            end: { line: 41, character: 49 },
          },
        ]
      );

      assert.strictEqual(
        output /* abc中文💖 */,
        "\\u0061\\u0062\\u0063\\u4e2d\\u6587\\ud83d\\udc96"
      );
    });

    suite("randomCase", () => {
      const input = "Hello, World!";

      test("maintains string length and lowercased content", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.randomCase",
          [
            {
              start: { line: 42, character: 0 },
              end: { line: 42, character: 13 },
            },
          ]
        );
        assert.equal(input.length, 13);
        assert.equal(input.toLowerCase() /* Hello, World! */, "hello, world!");
      });

      test("changes the case of at least one character (statistically)", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.randomCase",
          [
            {
              start: { line: 42, character: 0 },
              end: { line: 42, character: 13 },
            },
          ]
        );
        let changed = false;
        for (let i = 0; i < 10; i++) {
          if (
            output !== input &&
            output.toLowerCase() === input.toLowerCase()
          ) {
            changed = true;
            break;
          }
        }
        assert.equal(changed, true);
      });

      test("handles empty strings", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.randomCase",
          [
            {
              start: { line: 42, character: 0 },
              end: { line: 42, character: 0 },
            },
          ]
        );
        assert.equal(output, "");
      });

      test("preserves non-alphabetic characters", async () => {
        const specialChars = "12345!@#$%";
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.randomCase",
          [
            {
              start: { line: 43, character: 0 },
              end: { line: 43, character: 10 },
            },
          ]
        );
        assert.equal(output /* 12345!@#$% */, specialChars);
      });

      test("handles strings with mixed content", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.randomCase",
          [
            {
              start: { line: 44, character: 0 },
              end: { line: 44, character: 8 },
            },
          ]
        );
        assert.equal(output.length, 8);
        assert.notEqual(output.replace(/[^a-zA-Z]/g, ""), "");
      });
    });

    suite("swapQuotes", () => {
      test("swaps outer single quotes to double quotes and inner double quotes to single quotes", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.swapQuotes",
          [
            {
              start: { line: 45, character: 0 },
              end: { line: 45, character: 19 },
            },
          ]
        );
        assert.strictEqual(
          output /* 'She said, "Hello"' */,
          `"She said, 'Hello'"`
        );
      });

      test("swaps outer double quotes to single quotes and escapes inner apostrophe", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.swapQuotes",
          [
            {
              start: { line: 46, character: 0 },
              end: { line: 46, character: 20 },
            },
          ]
        );
        assert.strictEqual(
          output /* "My name's Minalike" */,
          `'My name\\'s Minalike'`
        );
      });

      test("swaps outer double quotes to single quotes, inner single quotes to double quotes, and escapes apostrophe in contraction", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.swapQuotes",
          [
            {
              start: { line: 47, character: 0 },
              end: { line: 47, character: 25 },
            },
          ]
        );
        assert.strictEqual(
          output /* "He said, 'It's a trap!'" */,
          `'He said, "It\\'s a trap!"'`
        );
      });

      test("swaps outer single quotes to double quotes and inner escaped double quotes to escaped single quotes", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.swapQuotes",
          [
            {
              start: { line: 48, character: 0 },
              end: { line: 48, character: 27 },
            },
          ]
        );
        assert.strictEqual(
          output /* 'She exclaimed, \\"Wow!\\"' */,
          `"She exclaimed, \\'Wow!\\'"`
        );
      });

      test("swaps outer double quotes to single quotes and inner single quotes to double quotes", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.swapQuotes",
          [
            {
              start: { line: 49, character: 0 },
              end: { line: 49, character: 30 },
            },
          ]
        );
        assert.strictEqual(
          output /* "'Double' and 'single' quotes" */,
          `'"Double" and "single" quotes'`
        );
      });

      test("returns input unchanged when string is not properly quoted", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.swapQuotes",
          [
            {
              start: { line: 50, character: 0 },
              end: { line: 50, character: 16 },
            },
          ]
        );
        assert.strictEqual(output /* No quotes at all */, `No quotes at all`);
      });

      test("swaps outer single quotes to double quotes, preserving inner apostrophe", async () => {
        const [output] = await getTextForSelectionsByCommand(
          "string-manipulation.swapQuotes",
          [
            {
              start: { line: 51, character: 0 },
              end: { line: 51, character: 6 },
            },
          ]
        );
        assert.strictEqual(output /* 'It's' */, `"It's"`);
      });
    });
  });
});
