// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const fs = require('fs');


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "test-code" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('test-code.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello VScode from test_code!');
	});

    // whenever this command is called, it should scan the current file for all functions without test code counterparts in
    // another file called test_suite. If there is a function in test_suite named test_<function_name> then it should
    // be skipped. If there is no function in test_suite named test_<function_name> then it should be created.
    // If test_suite does not exist, it should be created.
    // this function should not be run if the current file is test_suite.
    // this function should write test code based on the description of the function, and not the function code itself.
    let write_test_code = vscode.commands.registerCommand('test-code.writeTestCode', function () {
        // get the current file
        let current_file = vscode.window.activeTextEditor.document.fileName;
        // if the current file is test_suite, return
        if (current_file.endsWith("test_suite.py")) {
            return;
        }
        // if test_suite does not exist, create it
        let test_suite = current_file.substring(0, current_file.lastIndexOf("/")) + "/test_suite.py";
        try {
            if (fs.existsSync(test_suite)) {
                // file exists
            } else {
                // file does not exist
                fs.writeFile(test_suite, "", function (err) {
                    if (err) throw err;
                });
            }
        } catch (err) {
            console.error(err);
        }

        // need to get entire file content, then summarize it into a list of functions and related descriptions. Then
        // all openAI API with the function name and description as input, ask for test code and output that test code to 
        // test_suite.py. In the openAI API call, make sure to test the test code with inputs/ouputs that are expected, 
        // and if it's not the expected output, return the error and get openAI API to try again with the error as an
        // aditional input

        // get the current file name
        let current_file_name = current_file.substring(current_file.lastIndexOf("/") + 1, current_file.length);
        
        
        // get the current function name
        
    });
    context.subscriptions.push(write_test_code);
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
