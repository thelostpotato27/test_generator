import { Configuration, OpenAIApi } from "openai";
const vscode = require('vscode');
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY,});
const openai = new OpenAIApi(configuration);
const { exec } = require('child_process');
const fs = require('fs');

    // need to get entire file content, then summarize it into a list of functions and related descriptions. Then
    // call openAI API with the function name and description as input, ask for test code and output that test code to 
    // test_suite.py. In the openAI API call, make sure the input and outputs are in-line with the function description.
    // call the openAI API with the input/ouputs generated and function description to check if they match.
export function generateTests(current_file, testsuiteName) {


    // get the current file content
    let curr_file_content = vscode.window.activeTextEditor.document.getText();

    // get the current file content as a list of lines
    let curr_file_lines = curr_file_content.split("\n");

    //take a look at the comments below, they are incorrect. They describe what the code below does, but I recently figured
    //out a better way to do this, which is described above the testTests function.


    // input the curr file content into openAI API to get function names and descriptions
    // then input the function names and descriptions into openAI API to get test code
    // then test the test code with sample inputs and outputs
    // if the test code fails, input the error into openAI API to get new test code
    // then test the new test code with sample inputs and outputs
    // repeat until the test code passes
    // then write the test code to test_suite.py

    const funcDesc = openai.createCompletion({
        model: "gpt-3.5-turbo",
        messages: extractfunctionPrompt(curr_file_lines),
        temperature: 0.6,
    });
    const curr_file_functions = funcDesc[0][0][2][0].split("\n");
    
    for (let i = 0; i < curr_file_functions.length/2; i++) {
        let curr_func_name = curr_file_functions[i*2];
        let curr_func_desc = curr_file_functions[(i*2)+1];
        let error = "";

        let test_output = writeTests(curr_func_name, curr_func_desc, error)[0][0][2][0].split("\n");

        while (test_output[0] != "test passed") {
            test_output = writeTests(curr_func_name, curr_func_desc, test_output)[0][0][2][0].split("\n");
        }

        fs.writeFile(testsuiteName, test_output, (err) => {
        
        if (err) throw err;
            console.log('test code written successfully!');
        });
    }
    
}

function extractfunctionPrompt(curr_file_lines) {
    let output = [];

    const role_desc = {
        role: "system", 
        content: "You are a software engineer working on a project. You are tasked with writing descriptions for the functions below."
    };

    const user1 ={
        role: "user", 
        content: "Given a code snippet, output the function name, function description, and an input/output pair. Do not use the function code for the function description, only the comments. Ignore functions that do not have an output. when generating the input/output pair, make sure to have specific examples."
    };

    const assist1 ={
        role: "assistant", 
        content: "Give me an example of the output format"
    };

    const user2 ={
        role: "user",
        content: "here is an example of the output format

        Function Name: example_1(temp, temp1)
        Function Description: takes in two temperatures and returns the average of the two
        Input: [temp = 10, temp1 = 16]
        Output: [13]
        
        Function Name: example_2(temp)
        Function Description: takes in a random variable and returns the max of the variable
        Input: [temp = 10]
        Output: [10]"
    };

    const user3 ={
        role: "user",
        content: "The code snippet to be analyzed is below \n ${curr_file_lines}"
    };

    return output.push(role_desc, user1, assist1, user2, user3);
}

function createTestPrompt(curr_func_name, curr_func_desc, error) {
    if(error == "") {
        return `given the function name and description that follows, output the test code for that function.

        Function Name: ${curr_func_name}
        Function Description: ${curr_func_desc}`;
    }else{
        return `given the function name, description, and previous iteration test errors, output the test code for that function.

        Function Name: ${curr_func_name}
        Function Description: ${curr_func_desc}

        Function Error: ${error}`;
    }    
}

function writeTests(curr_func_name, curr_func_desc, error){

    let test_write = openai.createCompletion({
        model: "gpt-3.5-turbo",
        prompt: createTestPrompt(curr_func_name, curr_func_desc, error),
        temperature: 0.6,
    });
    let output = testTests(curr_func_name, curr_func_desc, test_write);
    return output;
}


//I may not even need to test the code by running it, if all the test functions do is have a set of inputs
//with expected outputs. instead of running the code, I can just compare the output of the function with the test code.
//I will still have to  rigerously examine the dummy input/output pairs to make sure they are correct, but I can do that
//with the openAI API.
function testTests(curr_func_name, curr_func_desc, test_code) {
    
    const interpreter = 'node'; // For JavaScript code
  
    // Execute the code using the specified interpreter
    exec(`${interpreter} -e "${test_code}"`, (error, stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(`Execution error: ${error.message}`);
        return [error.message, test_code];
      } else {
        // Show the output in the VSCode output channel
        vscode.window.showInformationMessage(stdout);
      }
    });

    return ["test passed",test_code];
}
