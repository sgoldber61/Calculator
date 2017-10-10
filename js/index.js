var MAX_VALUE = 1e100;
var MIN_VALUE = 1e-99;
var PRECISION = 10;
var OPERATIONS = [" + ", " - ", " * ", " / ", " ^ ", "-"]; // add, subtract, multiply, divide, exponent, negative
var FULL_OPERATIONS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")"];
var FULL_KEYWORDS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")", "Ans"];
var RESTRICTED_OPERATIONS = [" + ", " - ", " * ", " / ", " ^ "];
var NUMERICAL_CHARACTERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

// returns a number
function evaluateExpression(array) {
  // evaluate parentheses, testing for initial overflow/underflow along the way.
  for (var i = 0; i < array.length; i++) {
    if (Array.isArray(array[i])) {
      array[i] = evaluateExpression(array[i]);
    }
    else if (!OPERATIONS.includes(array[i])) {
      if (!isFinite(array[i]) || Math.abs(array[i]) >= MAX_VALUE)
        throw new Error("Error input overflow");
      else if (Math.abs(array[i]) < MIN_VALUE)
        array[i] = 0;
    }
  }
  if (array.length == 1)
    return Number(array[0].toPrecision(PRECISION));

  // evaluate exponents and negatives from right to left. the result goes into arrayE in reverse order, and then arrayE gets re-reversed.
  var arrayE = [];
  var i = array.length - 1;
  while (i > 0) {
    // process negation
    if (array[i - 1] === "-") {
      array[i - 1] = -array[i];
      i--;
    }

    // process exponentiation
    if (array[i - 1] === " ^ ") {
      if (array[i - 2] == 0 && array[i] == 0)
        throw new Error("Error power");

      var value = Math.pow(array[i - 2], array[i]);
      if (!isFinite(value) || Math.abs(value) >= MAX_VALUE)
        throw new Error("Error power");
      else if (Math.abs(value) < MIN_VALUE)
        value = 0;

      array[i - 2] = value;
      i -= 2;
    }
    else {
      arrayE.push(array[i]);
      i--;
    }
  }
  // final process negation
  if (i == 0)
    arrayE.push(array[0]);
  arrayE.reverse();
  if (arrayE.length == 1)
    return Number(arrayE[0].toPrecision(PRECISION));

  // evaluate multiplication and division
  var arrayM = [];
  i = 1;
  while (i < arrayE.length) {
    if (arrayE[i] === " * " || arrayE[i] === " / ") {
      var value = (arrayE[i] === " * " ? arrayE[i - 1] * arrayE[i + 1] : arrayE[i - 1] / arrayE[i + 1]);
      if (!isFinite(value) || Math.abs(value) >= MAX_VALUE)
        throw new Error("Error mult " + !isFinite(value));
      else if (Math.abs(value) < MIN_VALUE)
        value = 0;

      arrayE[i + 1] = value;
    }
    else {
      arrayM.push(arrayE[i - 1]);
      arrayM.push(arrayE[i]);
    }

    i += 2;
  }
  arrayM.push(arrayE[arrayE.length - 1]);
  if (arrayM.length == 1)
    return Number(arrayM[0].toPrecision(PRECISION));

  // evaluate addition and subtraction
  // upon every additive operation, check the value of the final number and compare it to the operands
  // Artificially cut out digits after an additive operation
  for (var i = 1; i < arrayM.length; i += 2) {
    var value = (arrayM[i] === " + " ? arrayM[i - 1] + arrayM[i + 1] : arrayM[i - 1] - arrayM[i + 1]);
    if (!isFinite(value) || Math.abs(value) >= MAX_VALUE)
      throw new Error("Error add");
    else if (Math.abs(value) < MIN_VALUE)
      value = 0;

    var absValue = Math.abs(value);
    var prevValue = Math.max(arrayM[i - 1], arrayM[i + 1]);
    if (absValue < prevValue && absValue != 0) {
      var ratio = absValue / prevValue;
      var newPrecision = PRECISION + Math.round(Math.log(ratio) / Math.log(10));
      value = (newPrecision > 0 ? Number(value.toPrecision(newPrecision)) : 0);
    }

    arrayM[i + 1] = value;
  }

  return Number(arrayM[arrayM.length - 1].toPrecision(PRECISION));
}

// ---------------------------------------------------------------------------------------------------------------------------------------------

// input is an array of strings, parentheses is a number: how many unclosed left parentheses.

// display our (potentially incomplete) input in string format
function inputString(input) {
  if (input.length == 0) {
    return "0";
  }
  else {
    // replace cases of two or more spaces with a single space.
    return input.join("").replace(/ {2,}/g, " ");
  }
}

// step 1: pad right parentheses

function padParentheses(input, parentheses) {
  var output = input.slice();

  for (var i = 0; i < parentheses; i++)
    output.push(")");

  return output;
}

// step 2: turn number subarrays and Ans into actual numerical values

function createNumbers(input, ansValue) {
  var output = [];
  var i = 0;
  while (i < input.length) {
    if (FULL_OPERATIONS.includes(input[i])) { // if generalized operation, push and move on.
      output.push(input[i]);
      i++;
    }
    else if (input[i] == "Ans") {
      output.push(ansValue);
      i++;
    }
    else {
      var number = 0;
      var frontQ = false;
      if (!isNaN(parseInt(input[i].charAt(0), 10))) {
        number = parseInt(input[i], 10);
        frontQ = true;
        i++;
      }
      if (i < input.length && input[i].charAt(0) == ".") {
        number += parseFloat(input[i] + "0");
        frontQ = true;
        i++;
      }
      if (i < input.length && input[i].charAt(0) == "e") {
        if (frontQ)
          number *= parseFloat("1" + input[i]);
        else
          number = parseFloat("1" + input[i]);
        i++;
      }

      output.push(number);
    }
  }

  return output;
}

// step 3: re-arrange parentheses into sub-expressions

function createSubexpressions(input, begin, end) {
  var output = [];
  var i = begin;
  while (i < end) {
    if (input[i] != "(") {
      output.push(input[i]);
      i++;
    }
    else {
      var openParentheses = 1;
      var j = i + 1;
      while (j < end) { // "j < end" might as well be just "true"
        if (input[j] == "(")
          openParentheses++;
        else if (input[j] == ")")
          openParentheses--;

        if (openParentheses == 0)
          break;
        j++;
      }

      output.push(createSubexpressions(input, i + 1, j));
      i = j + 1;
    }
  }

  return output;
}

function createAllSubexpressions(input) {
  return createSubexpressions(input, 0, input.length);
}

// ---------------------------------------------------------------------------------------------------------------------------------------------


// initialize state variables.
// declare click behavior for buttons.

var input = [];
var parentheses = 0;
var display = "0";
var topDisplay = "Ans = 0";
var justEvaluatedQ = false; // true if top is "3 * 4 =", false if top is "Ans = 12".
var ans = 0;

function updateDisplay() {
  display = inputString(input);
  document.getElementById("main-line").innerHTML = display;
}

function updateTopDisplay() {
  document.getElementById("top-line").innerHTML = topDisplay;
}

function justEvaluatedReset(idString) {
  if (justEvaluatedQ) {
    justEvaluatedQ = false;
    topDisplay = "Ans = " + ans;
    updateTopDisplay();
    
    // handle error
    if (input[0] == "Error") {
      input = [];
    }
    // if we're not adding, subtracting, multiplying, dividing, or exponentiating by our output number, then clear out the input.
    else if (!RESTRICTED_OPERATIONS.includes(idString) && idString != "backspace") {
      input = [];
    }
  }
}

function lastFullNumerical(input) {
  // last element's digit is numerical, or a decimal point and the element before that is a number, or is ans, or is ), then: 
  // return true.
  return (!isNaN(input[input.length - 1].substr(-1)) && input[input.length - 1].substr(-1) != " ") || (input[input.length - 1] == "." && !isNaN(input[input.length - 2])) || (input[input.length - 1] == "Ans") || (input[input.length - 1] == ")");
}

// ---------------------------------------------------------------------------------------------------------------------------------------------

// Enter: =

function outputToNewInput(output) {
  // process numerical output (which is an integer)
  var stringOutput = output.toString();

  // process negative number
  var negativeQ = (stringOutput.charAt(0) == "-");
  if (negativeQ) {
    stringOutput = stringOutput.slice(1);
    output = -output;
  }

  // integer with too many digits i.e. more than 10
  if (stringOutput.search(/^[0-9]+$/) != -1 && stringOutput.length > PRECISION) {
    var stringOutput = output.toExponential();
  }

  // process exponential
  var index = stringOutput.search(/e/);
  var input = (index == -1 ? [stringOutput] : [stringOutput.slice(0, index), stringOutput.slice(index).replace(/e\+/, "e")]);

  // process decimal
  index = input[0].search(/\./);
  if (index != -1) {
    input.unshift(input[0].slice(0, index));
    input[1] = input[1].slice(index);
  }

  // tack on front negative sign, if necessary
  if (negativeQ)
    input.unshift("-");

  return input;
}

document.getElementById(" = ").onclick = function() {
  // if justEvaluated or blank, do nothing.
  if (justEvaluatedQ || input.length == 0) {
    return;
  }
  // if not lastFullNumerical, do nothing.
  if (!lastFullNumerical(input)) {
    return;
  }

  console.log("input to evaluate:");
  console.log(input);

  input = padParentheses(input, parentheses);
  parentheses = 0;
  var expression = createAllSubexpressions(createNumbers(input, ans));
  try {
    var output = evaluateExpression(expression); // numerical output

    // update top row, main row, and ans
    topDisplay = inputString(input) + " =";
    updateTopDisplay();

    input = outputToNewInput(output);
    updateDisplay();
    console.log("next input:");
    console.log(input);

    ans = output;
    justEvaluatedQ = true;
  }
  catch (error) {
    topDisplay = inputString(input) + " =";
    updateTopDisplay();
    
    input = ["Error"];
    updateDisplay();
    console.log("next input:");
    console.log(input);
    
    ans = 0;
    justEvaluatedQ = true;
  }
};

// for all of these, call updateDisplay() at the end no matter what.


// All Clear
document.getElementById("AC").onclick = function() {
  // clear ans if necessary
  if (input.length == 0) {
    topDisplay = "Ans = 0";
    updateTopDisplay();
    
    ans = 0;
  }
  
  justEvaluatedReset("AC");
  
  input = [];
  parentheses = 0;
  updateDisplay();
};

// Backspace
document.getElementById("backspace").onclick = function() {
  justEvaluatedReset("backspace");

  if (input.length > 0) {
    if (FULL_KEYWORDS.includes(input[input.length - 1])) {
      var popped = input.pop();
      if (popped == "(")
        parentheses--;
      else if (popped == ")")
        parentheses++;
    }
    else {
      input[input.length - 1] = input[input.length - 1].slice(0, -1);
      if (input[input.length - 1] == "")
        input.pop();
    }
  }

  updateDisplay();
};

// RESTRICTED_OPERATIONS = [" + ", " - ", " * ", " / ", " ^ "]
RESTRICTED_OPERATIONS.forEach(function(id) {
  document.getElementById(id).onclick = function() {
    justEvaluatedReset(id);

    if (input.length > 0) {
      // if restricted operation, override the restricted operation.
      if (RESTRICTED_OPERATIONS.includes(input[input.length - 1])) {
        input[input.length - 1] = id;
      }
      // if full numerical, tack on our operation.
      else if (lastFullNumerical(input)) {
        input.push(id);
      }
    }

    updateDisplay();
  };
});

// var FULL_KEYWORDS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")", "Ans"]

// numerical buttons
NUMERICAL_CHARACTERS.forEach(function(id) {
  document.getElementById(id).onclick = function() {
    justEvaluatedReset(id);

    if (FULL_KEYWORDS.includes(input[input.length - 1]) || input.length == 0) {
      if (input[input.length - 1] == ")" || input[input.length - 1] == "Ans") {
        input.push(" * ");
        input.push(id);
      }
      else {
        input.push(id);
      }
    }
    else { // if numerical button press follows a number
      // if identically zero, override
      if (input[input.length - 1] == "0") {
        input[input.length - 1] = id;
      }
      else if (input[input.length - 1] == "e0") {
        input[input.length - 1] = "e" + id;
      }
      // otherwise, tack on
      else {
        input[input.length - 1] += id;
      }
    }

    updateDisplay();
  };
});

// Ans

// var FULL_KEYWORDS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")", "Ans"]

document.getElementById("Ans").onclick = function() {
  justEvaluatedReset("Ans");

  if (FULL_KEYWORDS.includes(input[input.length - 1]) || input.length == 0) {
    if (input[input.length - 1] == ")" || input[input.length - 1] == "Ans") {
      input.push(" * ");
      input.push("Ans");
    }
    else {
      input.push("Ans");
    }
  }
  else if (lastFullNumerical(input)) {
    input.push(" * ");
    input.push("Ans");
  }

  updateDisplay();
};

// negative

// RESTRICTED_OPERATIONS = [" + ", " - ", " * ", " / ", " ^ "]

document.getElementById("-").onclick = function() {
  justEvaluatedReset("-");

  if (RESTRICTED_OPERATIONS.includes(input[input.length - 1]) || input[input.length - 1] == "(" || input.length == 0) {
    input.push("-");
  }

  if (input[input.length - 1] == "e") {
    input[input.length - 1] += "-";
  }

  updateDisplay();
};

// decimal point

// var FULL_KEYWORDS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")", "Ans"]

document.getElementById("decimal").onclick = function() {
  justEvaluatedReset(".");

  if (FULL_KEYWORDS.includes(input[input.length - 1]) || input.length == 0) {
    if (input[input.length - 1] == ")" || input[input.length - 1] == "Ans") {
      input.push(" * ");
      input.push(".");
    }
    else {
      input.push(".");
    }
  }
  else if (input[input.length - 1].charAt(0) != "." && input[input.length - 1].charAt(0) != "e") {
    input.push(".");
  }

  updateDisplay();
};

// exponential

// var FULL_KEYWORDS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")", "Ans"]

document.getElementById("e").onclick = function() {
  justEvaluatedReset("e");

  if (FULL_KEYWORDS.includes(input[input.length - 1]) || input.length == 0) {
    if (input[input.length - 1] == ")" || input[input.length - 1] == "Ans") {
      input.push(" * ");
      input.push("e");
    }
    else {
      input.push("e");
    }
  }
  // no "e" or isolated decimal
  else if (input[input.length - 1].charAt(0) != "e" && !(input[input.length - 1] == "." && isNaN(input[input.length - 2]))) {
    input.push("e");
  }
  
  updateDisplay();
};

// left paren

document.getElementById("(").onclick = function() {
  justEvaluatedReset("(");

  if (FULL_KEYWORDS.includes(input[input.length - 1]) || input.length == 0) {
    if (input[input.length - 1] == ")" || input[input.length - 1] == "Ans") {
      input.push(" * ");
      input.push("(");
    }
    else {
      input.push("(");
    }

    parentheses++;
  }
  else if (lastFullNumerical(input)) {
    input.push(" * ");
    input.push("(");

    parentheses++;
  }

  updateDisplay();
};

// right paren

document.getElementById(")").onclick = function() {
  justEvaluatedReset(")");

  if (parentheses > 0 && lastFullNumerical(input)) {
    input.push(")");
    parentheses--;
  }

  updateDisplay();
};