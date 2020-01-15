const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const myExtension = require('../../extension');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');
	const tests = [
		['camelize', 'moz-transform', 'mozTransform'],
		['camelize', '-moz-transform', 'MozTransform'],
		['capitalize', 'foo Bar', 'Foo Bar'],
		['sentence', 'foo Bar', 'Foo bar'],
		['classify', 'some_class_name', 'SomeClassName'],
		['dasherize', 'MozTransform', '-moz-transform'],
		['decapitalize', 'Foo Bar', 'foo Bar'],
		['humanize', '  capitalize dash-CamelCase_underscore trim  ', 'Capitalize dash camel case underscore trim'],
		['reverse', 'Abc', 'cbA'],
		['slugify', 'Un éléphant à l\'orée du bois', 'un-elephant-a-l-oree-du-bois'],
		['swapCase', 'HELLOworld', 'helloWORLD'],
		['snake', 'This-is_snake case', 'this_is_snake_case'],
		['screaming-snake', 'screaming-snake case', 'SCREAMING_SNAKE_CASE'],
		['titleize', 'my name is tristan', 'My Name Is Tristan'],
		['titleize-ap-style', 'this is a test', 'This Is a Test'],
		['titleize-chicago-style', 'The quick brown fox jumps over the lazy dog.', 'The Quick Brown Fox Jumps Over the Lazy Dog.'],
		['underscored', 'Underscored-is-like  snake-case', 'underscored_is_like_snake_case'],
	]
	suite('commandNameFunctionMap outputs correctly for all methods', () => {
		tests.forEach(testData => {
			test(testData[0] + ' returns ' + testData[2] + ' when called with ' + testData[1], () => {
				assert.equal(myExtension.commandNameFunctionMap[testData[0]](testData[1]), testData[2])
			});
		})
	});
});
