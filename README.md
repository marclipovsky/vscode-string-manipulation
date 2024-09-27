![Node.js CI](https://github.com/marclipovsky/vscode-string-manipulation/workflows/Node.js%20CI/badge.svg)

# String Manipulation for VSCode

This extension provides string manipulation commands for any selected text as well
as multiple selections.

Current string functions available:

1. camelize
1. capitalize
1. classify
1. chop - split into groups provided n # of characters
1. clean
1. clean diacritics
1. dasherize
1. decapitalize
1. humanize
1. reverse
1. screaming snake
1. sentence
1. slugify
1. snake
1. underscore
1. swap case
1. titleize
1. titleize (AP Style)
1. titleize (Chicago Style)
1. truncate - trims string to n # of characters and appends ellipsis
1. prune - truncate but keeps ellipsis within character count provided
1. repeat - repeat selection n #of times
1. convert between unicode and readable characters.

Number related functions:

1. increment all numbers in selection
1. decrement all numbers in selection
1. duplicate selection and increment all number
1. duplicate selection and decrement all number
1. sequence all numbers in selection from first number

## Use

To use these commands, press ⌘+p and enter any of the commands above while text is selected in your editor.

![String Manipulation Screencast](images/demo.gif)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
