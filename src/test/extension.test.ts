import * as assert from "assert";
import { afterEach, beforeEach, suite, test } from "mocha";
import * as path from "path";
import * as vscode from "vscode";
import { CommandFunction, commandNameFunctionMap } from "../commands";

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
      editor.selections.map((selection) => editor.document.getText(selection))
    );
  };

  suite("activation events", () => {
    const extension = vscode.extensions.getExtension(
      "marclipovsky.string-manipulation"
    )!;

    test("is not active by default", () => {
      assert.equal(false, extension.isActive);
    });

    test("invoked when running one of the commands", async () => {
      await vscode.commands.executeCommand("string-manipulation.titleize");
      assert.equal(true, extension.isActive);
    });
  });

  suite("commands", () => {
    test("camelize", async () => {
      const [output1, output2] = await getTextForSelectionsByCommand(
        "string-manipulation.camelize",
        [
          { start: { line: 0, character: 0 }, end: { line: 0, character: 14 } },
          { start: { line: 1, character: 0 }, end: { line: 1, character: 15 } },
        ]
      );

      assert.strictEqual(output1, "mozTransform");
      assert.strictEqual(output2, "MozTransform");
    });

    test("capitalize", async () => {
      const [output1, output2] = await getTextForSelectionsByCommand(
        "string-manipulation.capitalize",
        [
          { start: { line: 2, character: 0 }, end: { line: 2, character: 3 } },
          { start: { line: 2, character: 4 }, end: { line: 2, character: 8 } },
        ]
      );

      assert.strictEqual(output1, "Foo");
      assert.strictEqual(output2, "Bar");
    });

    test("clean", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.clean",
        [{ start: { line: 3, character: 0 }, end: { line: 3, character: 15 } }]
      );

      assert.strictEqual(output, "foo bar");
    });

    test("cleanDiacritics", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.cleanDiacritics",
        [{ start: { line: 4, character: 0 }, end: { line: 4, character: 8 } }]
      );

      assert.strictEqual(output, "aakkonen");
    });

    test("sentence", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.sentence",
        [{ start: { line: 5, character: 0 }, end: { line: 5, character: 7 } }]
      );

      assert.strictEqual(output, "Foo bar");
    });

    test("classify", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.classify",
        [{ start: { line: 6, character: 0 }, end: { line: 6, character: 15 } }]
      );

      assert.strictEqual(output, "SomeClassName");
    });

    test("dasherize", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.dasherize",
        [{ start: { line: 7, character: 0 }, end: { line: 7, character: 12 } }]
      );

      assert.strictEqual(output, "-moz-transform");
    });

    test("decapitalize", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.decapitalize",
        [{ start: { line: 8, character: 0 }, end: { line: 8, character: 7 } }]
      );

      assert.strictEqual(output, "foo Bar");
    });

    test("humanize", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.humanize",
        [{ start: { line: 9, character: 0 }, end: { line: 9, character: 45 } }]
      );

      assert.strictEqual(output, "Capitalize dash camel case underscore trim");
    });

    test("reverse", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.reverse",
        [{ start: { line: 10, character: 0 }, end: { line: 10, character: 3 } }]
      );

      assert.strictEqual(output, "cbA");
    });

    test("slugify", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.slugify",
        [
          {
            start: { line: 11, character: 0 },
            end: { line: 11, character: 28 },
          },
        ]
      );

      assert.strictEqual(output, "un-elephant-a-l-oree-du-bois");
    });

    test("swapCase", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.swapCase",
        [
          {
            start: { line: 12, character: 0 },
            end: { line: 12, character: 10 },
          },
        ]
      );

      assert.strictEqual(output, "helloWORLD");
    });

    test("snake", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.snake",
        [
          {
            start: { line: 13, character: 0 },
            end: { line: 13, character: 18 },
          },
        ]
      );

      assert.strictEqual(output, "this_is_snake_case");
    });

    test("screamingSnake", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.screamingSnake",
        [
          {
            start: { line: 14, character: 0 },
            end: { line: 14, character: 20 },
          },
        ]
      );

      assert.strictEqual(output, "SCREAMING_SNAKE_CASE");
    });

    test("titleize", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.titleize",
        [
          {
            start: { line: 15, character: 0 },
            end: { line: 15, character: 18 },
          },
        ]
      );

      assert.strictEqual(output, "My Name Is Tristan");
    });

    test("titleizeApStyle", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.titleizeApStyle",
        [
          {
            start: { line: 16, character: 0 },
            end: { line: 16, character: 14 },
          },
        ]
      );

      assert.strictEqual(output, "This Is a Test");
    });

    test("titleizeChicagoStyle", async () => {
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
        output,
        "The Quick Brown Fox Jumps Over the Lazy Dog."
      );
    });

    test("underscored", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.underscored",
        [
          {
            start: { line: 18, character: 0 },
            end: { line: 18, character: 31 },
          },
        ]
      );

      assert.strictEqual(output, "underscored_is_like_snake_case");
    });

    test("chop", async () => {
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

      assert.strictEqual(output, "aa,bb,cc,dd");
    });

    test("truncate", async () => {
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

      assert.strictEqual(output, "aabb...");
    });

    test("prune", async () => {
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

      assert.strictEqual(output, "aabbc...");
    });

    test("repeat", async () => {
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

      assert.strictEqual(output, "aabbccddaabbccdd");
    });

    test("increment", async () => {
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

      assert.strictEqual(output1, "a2 b3 c4 5d 6e 7f 13x y24 35z46");
      assert.strictEqual(output2, "a2 b3 c4 5d 6e\n7f 13x y24 35z46");
      assert.strictEqual(output3, "a-3 b-2 c-1 0d 1e\n7f 13x y24 35z46");
    });

    test("decrement", async () => {
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

      assert.strictEqual(output1, "a0 b1 c2 3d 4e 5f 11x y22 33z44");
      assert.strictEqual(output2, "a0 b1 c2 3d\n4e 5f 11x y22 33z44");
      assert.strictEqual(output3, "a-4 b-3 c-2 -1d\n0e 5f 11x y22 33z44");
    });

    test("duplicateAndIncrement", async () => {
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
        "a1 b2 c3 4d 5e 6f 12x y23 34z45a2 b3 c4 5d 6e 7f 13x y24 35z46\n"
      );
    });

    test("duplicateAndDecrement", async () => {
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
        "a1 b2 c3 4d 5e 6f 12x y23 34z45a0 b1 c2 3d 4e 5f 11x y22 33z44\n"
      );
    });

    test("sequence", async () => {
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

      assert.strictEqual(output1, "a1 b2 c3 4d 5e 6f 7x y8 9z10");
      assert.strictEqual(output2, "a11 b12 c13\n14d 15e 16f 17x y18 19z20");
    });

    test("utf8ToChar", async () => {
      const [output] = await getTextForSelectionsByCommand(
        "string-manipulation.utf8ToChar",
        [
          {
            start: { line: 40, character: 0 },
            end: { line: 40, character: 49 },
          },
        ]
      );

      assert.strictEqual(output, "abc中文💖");
    });

    test("charToUtf8", async () => {
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
        output,
        "\\u0061\\u0062\\u0063\\u4e2d\\u6587\\ud83d\\udc96"
      );
    });

    suite("randomCase", () => {
      const input = "Hello, World!";

      test("check length and compare lower case", async () => {
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
        assert.equal(input.toLowerCase(), "hello, world!");
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
        assert.equal(output, specialChars);
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
  });
});
