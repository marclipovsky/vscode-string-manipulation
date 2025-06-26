# Custom Regex Commands

The String Manipulation extension now supports custom regex-based commands that you can configure yourself!

## How to Access Custom Commands

1. Select some text in your editor
2. Open Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
3. Type "String Manipulation: Custom Command"
4. Choose from your configured custom commands

## How to Configure Custom Commands

### Via Settings UI
1. Open VS Code Settings (`Cmd+,` or `Ctrl+,`)
2. Search for "string manipulation custom"
3. Click "Edit in settings.json" next to "Custom Commands"

### Via settings.json
Add this to your VS Code settings:

```json
{
  "stringManipulation.customCommands": [
    {
      "name": "Extract Numbers",
      "searchPattern": "[^0-9]",
      "replacement": "",
      "global": true
    },
    {
      "name": "Wrap in Quotes",
      "searchPattern": "^(.*)$",
      "replacement": "\"$1\""
    },
    {
      "name": "Camel to Snake",
      "searchPattern": "([a-z])([A-Z])",
      "replacement": "$1_$2",
      "global": true
    },
    {
      "name": "Remove Vowels",
      "searchPattern": "[aeiouAEIOU]",
      "replacement": "",
      "global": true
    },
    {
      "name": "Add Prefix",
      "searchPattern": "^(.*)$",
      "replacement": "PREFIX_$1",
      "global": true,
      "multiline": true
    },
    {
      "name": "Case Insensitive Replace",
      "searchPattern": "hello",
      "replacement": "hi",
      "global": true,
      "ignoreCase": true
    }
  ]
}
```

## Regex Features Supported

- **Capture Groups**: Use `$1`, `$2`, etc. to reference captured groups
- **Full Match**: Use `$&` to reference the entire match
- **Named Flag Properties**: Use boolean properties for clear flag configuration
- **All JavaScript regex features**: Full JavaScript regex syntax support

## Regular Expression Flags

Instead of using cryptic flag letters, use clear boolean properties in your custom commands. These correspond to the [JavaScript RegExp flags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags):

| Property | Flag | Description | Default |
|----------|------|-------------|---------|
| `global` | `g` | Find all matches rather than stopping after the first match | `true` |
| `ignoreCase` | `i` | Case-insensitive search | `false` |
| `multiline` | `m` | `^` and `$` match start/end of line, not just start/end of string | `false` |
| `dotAll` | `s` | `.` matches newline characters | `false` |
| `unicode` | `u` | Enable full Unicode support | `false` |
| `sticky` | `y` | Match only at the index indicated by the lastIndex property | `false` |

**Example with flags:**
```json
{
  "name": "Case Insensitive Word Replace",
  "searchPattern": "\\bhello\\b",
  "replacement": "hi",
  "global": true,
  "ignoreCase": true,
  "multiline": true
}
```

## Examples

### Extract Only Numbers
```json
{
  "name": "Extract Numbers",
  "searchPattern": "[^0-9]",
  "replacement": "",
  "global": true
}
```
Input: `abc123def456` → Output: `123456`

### Convert camelCase to snake_case
```json
{
  "name": "Camel to Snake",
  "searchPattern": "([a-z])([A-Z])",
  "replacement": "$1_$2",
  "global": true
}
```
Input: `camelCaseString` → Output: `camel_Case_String`

### Wrap Lines in Quotes
```json
{
  "name": "Wrap in Quotes",
  "searchPattern": "^(.*)$",
  "replacement": "\"$1\"",
  "global": true,
  "multiline": true
}
```
Input: `hello world` → Output: `"hello world"`

### Extract Email Domains
```json
{
  "name": "Extract Email Domain",
  "searchPattern": ".*@(.+)",
  "replacement": "$1",
  "global": true
}
```
Input: `user@example.com` → Output: `example.com`

### Case-Insensitive Replace
```json
{
  "name": "Replace Hello (Any Case)",
  "searchPattern": "hello",
  "replacement": "hi",
  "global": true,
  "ignoreCase": true
}
```
Input: `Hello HELLO hello` → Output: `hi hi hi`

## Validation

The extension validates your regex patterns and will show helpful error messages if:
- The regex pattern is invalid
- Command names contain invalid characters
- Required fields are missing

## Features

- **Live Preview**: See transformation previews in the command picker
- **Multi-selection Support**: Works with multiple text selections
- **Dynamic Updates**: Changes to settings immediately update available commands
- **Integration**: Works with the repeat last action feature
- **Error Handling**: Clear error messages for invalid configurations

## Differences from VS Code Find & Replace

- **Saved Commands**: Your regex transformations are saved and reusable
- **Named Commands**: Give your transformations meaningful names
- **Quick Access**: Access via Command Palette without opening find/replace dialog
- **Multi-selection**: Apply to multiple selections at once
- **Integration**: Works seamlessly with other String Manipulation features