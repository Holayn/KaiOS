/**
 * This is the lexer, which performs lexical analysis on a source code
 * input with lex(), which returns an object which contains tokens,
 * errors, and warnings generated during lexing.
 */
var TSC;
(function (TSC) {
    var Lexer = /** @class */ (function () {
        function Lexer() {
            // public static lex() {
            // Define array to return tokens in
            this.tokens = [];
            // Define array to return errors in
            this.errors = [];
            // Define array to return warnings in
            this.warnings = [];
            // Pointers that make up the buffer of characters we are matching to
            this.startLexemePtr = 0;
            this.endLexemePtr = 1;
            // Tracker for current line number
            this.lineNumber = 1;
            // Tracker for current col
            this.colNumber = 0;
            // Flag signifying end of source code has been reached
            this.isComplete = false;
            // Keeps track of the lexer is currently in a comment block
            this.inComment = false;
            // Keeps track if we've run into EOP
            this.foundEOP = false;
            // Keeps track if we've run into a quotation mark
            this.foundQuote = false;
            // Line and col to keep track of quotation mark
            this.startQuoteCol = 0;
            this.startQuoteLine = 0;
            // Line and col to keep track of comment
            this.startCommentCol = 0;
            this.startCommentLine = 0;
            this.lexAnalysisRes = {};
        }
        Lexer.prototype.lex = function (prevProgramError) {
            // Grab the "raw" source code.
            var sourceCode = document.getElementById("taSourceCode").value;
            // Trim the leading and trailing spaces.
            sourceCode = TSC.Utils.trim(sourceCode);
            // We need to recognize different tokens.
            // Thus, we need to have the different patterns for each token defined.
            // A lexeme is a sequence of characters in the source that we match to a pattern for a token.
            // When a lexeme matches a pattern, create a new instance of that token.
            // Take the input and create tokens
            // Have a RegExp for each kind of token
            // RegExp for Left Brace
            var rLBRACE = new RegExp('{$');
            // RegExp for Right Brace
            var rRBRACE = new RegExp('}$');
            // RegExp for Left Paren
            var rLPAREN = new RegExp('\\($');
            // RegExp for Right Paren
            var rRPAREN = new RegExp('\\)$');
            // RegExp for Quote
            var rQUOTE = new RegExp('"$');
            // RegExp for EOP
            var rEOP = new RegExp('\\$$');
            // RegExp for ID
            var rID = new RegExp('[a-z]$');
            // RegExp for Character
            var rCHAR = new RegExp('[a-z]$');
            // RegExp for Space
            var rSPACE = new RegExp(' $');
            // RegExp for whitespace
            var rWHITE = new RegExp(' $|\t$|\n$|\r$');
            // RegExp for newline
            var rNEWLINE = new RegExp('\n$');
            // RegExp for Digit
            var rDIGIT = new RegExp('[0-9]$');
            // RegExp for IntOp
            var rINTOP = new RegExp('\\+$');
            // RegExp for BoolVal for true
            var rBOOLVALTRUE = new RegExp('true$');
            // RegExp for BoolVal for false
            var rBOOLVALFALSE = new RegExp('false$');
            // RegExp for While
            var rWHILE = new RegExp('while$');
            // RegExp for If
            var rIF = new RegExp('if$');
            // RegExp for Print
            var rPRINT = new RegExp('print$');
            // RegExp for Type Int
            var rTYPEINT = new RegExp('int$');
            // RegExp for Type Boolean
            var rTYPEBOOL = new RegExp('boolean$');
            // RegExp for Type String
            var rTYPESTR = new RegExp('string$');
            // RegExp for AssignmentOp
            var rASSIGN = new RegExp('\=$');
            // RegExp for BoolOp Equals
            var rBOOLOPEQUALS = new RegExp('\=\=$');
            // RegExp for BoolOp NotEquals
            var rBOOLOPNOTEQUALS = new RegExp('\\!\=$');
            // RegExp for Comment Start
            var rCOMMENTSTART = new RegExp('/\\*$');
            // RegExp for Comment End
            var rCOMMENTEND = new RegExp('\\*/$');
            // Run Regular Expression matching on the buffer of characters we have so far
            // If the character we just "added" to the buffer we're looking at creates a match...
            // Create a new Token for match
            // Iterate through the input, creating tokens out of lexemes
            // Runtime: O(n^2) where n is length of source code. One pass is performed over source code, 
            // with each iteration performing an O(n) regular expression check
            while (this.endLexemePtr <= sourceCode.length) {
                // For compiling multiple programs in sequence, if there was an error in the previous program,
                // keep on clearing the tokens array until we find an EOP token. Then from there,
                // we can lex the next program
                // Basically, keep on clearing the state of the lexer until we can start lexing the next program
                if (prevProgramError) {
                    this.foundQuote = false;
                    this.tokens = [];
                    this.errors = [];
                    this.warnings = [];
                }
                //We're iterating through the program, so that means we haven't found the EOP
                this.foundEOP = false;
                // If the lexer is currently looking in a comment block, just ignore input
                // Also perform check to see if comment end has been reached.
                if (this.inComment) {
                    // We have to keep track of newlines
                    if (rNEWLINE.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                        this.lineNumber++;
                        this.colNumber = 0;
                    }
                    if (rCOMMENTEND.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                        this.inComment = false;
                    }
                    this.endLexemePtr++;
                    continue;
                }
                // If the lexer is currently in a String literal, only test for Characters and Spaces.
                // If we reach another quote, we have reached the end of the String literal.
                if (this.foundQuote) {
                    if (rCHAR.test(sourceCode.charAt(this.endLexemePtr - 1))) {
                        var token = new TSC.Token(TSC.TokenType.TChar, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                        this.tokens.push(token);
                        this.colNumber++;
                    }
                    else if (rSPACE.test(sourceCode.charAt(this.endLexemePtr - 1))) {
                        var token = new TSC.Token(TSC.TokenType.TSpace, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                        this.tokens.push(token);
                        this.colNumber++;
                    }
                    else if (rQUOTE.test(sourceCode.charAt(this.endLexemePtr - 1))) {
                        var token = new TSC.Token(TSC.TokenType.TQuote, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                        this.tokens.push(token);
                        this.colNumber++;
                        this.foundQuote = false;
                    }
                    else {
                        // If we're on the hunt for an EOP, then ignore errors
                        if (prevProgramError) {
                            this.endLexemePtr++;
                            continue;
                        }
                        // If we run into a character that does not match a Character, throw an error
                        var char = sourceCode.charAt(this.endLexemePtr - 1);
                        if (char == "\n") {
                            char = "\\n";
                        }
                        else if (char == "\r") {
                            char = "\\r";
                        }
                        else if (char == "\t") {
                            char = "\\t";
                        }
                        this.errors.push(new TSC.Error(TSC.ErrorType.InvalidCharacterInString, char, this.lineNumber, this.colNumber));
                        this.foundQuote = false;
                        // this.endLexemePtr++;
                        // this.colNumber++;
                        break;
                    }
                    this.endLexemePtr++;
                    continue;
                }
                // Test for Left Brace
                if (rLBRACE.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TLbrace, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                    this.tokens.push(token);
                }
                else if (rRBRACE.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TRbrace, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                    this.tokens.push(token);
                }
                else if (rLPAREN.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TLparen, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                    this.tokens.push(token);
                }
                else if (rRPAREN.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TRparen, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                    this.tokens.push(token);
                }
                else if (rQUOTE.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TQuote, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                    this.tokens.push(token);
                    if (!this.foundQuote) {
                        // We've reached the beginning quote, start treating characters afterwards as ones inside a String
                        this.foundQuote = true;
                        // Keep track of the index of this quote so we can report an error later if there is on
                        this.startQuoteCol = this.colNumber;
                        this.startQuoteLine = this.lineNumber;
                    }
                }
                else if (rBOOLVALTRUE.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TBoolval, "true", this.lineNumber, this.colNumber - ("true".length - 1));
                    // We have to remove the IDs that have been identified and added to the tokens array
                    // 4 ID tokens have been added - "t", "r", "u", "e"... remove them from the array
                    this.tokens = this.tokens.slice(0, this.tokens.length - ("true".length - 1));
                    this.tokens.push(token);
                }
                else if (rBOOLVALFALSE.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TBoolval, "false", this.lineNumber, this.colNumber - ("false".length - 1));
                    // We have to remove the IDs that have been identified and added to the tokens array
                    // 5 ID tokens have been added - "f", "a", "l", "s"... remove them from the array
                    this.tokens = this.tokens.slice(0, this.tokens.length - ("false".length - 1));
                    this.tokens.push(token);
                }
                else if (rWHILE.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TWhile, "while", this.lineNumber, this.colNumber - ("while".length - 1));
                    // We have to remove the IDs that have been identified and added to the tokens array
                    // 4 ID tokens have been added - "w", "h", "i", "l"... remove them from the array
                    this.tokens = this.tokens.slice(0, this.tokens.length - ("while".length - 1));
                    this.tokens.push(token);
                }
                else if (rIF.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TIf, "if", this.lineNumber, this.colNumber - ("if".length - 1));
                    // We have to remove the IDs that have been identified and added to the tokens array
                    // 1 ID token has been added - "i"... remove them from the array
                    this.tokens = this.tokens.slice(0, this.tokens.length - ("if".length - 1));
                    this.tokens.push(token);
                }
                else if (rPRINT.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TPrint, "print", this.lineNumber, this.colNumber - ("print".length - 1));
                    // We have to remove the IDs that have been identified and added to the tokens array
                    // 4 ID tokens have been added - "p", "r", "i", "n"... remove them from the array
                    this.tokens = this.tokens.slice(0, this.tokens.length - ("print".length - 1));
                    this.tokens.push(token);
                }
                else if (rTYPEINT.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TType, TSC.VariableType.Int, this.lineNumber, this.colNumber - ("int".length - 1));
                    // We have to remove the IDs that have been identified and added to the tokens array
                    // 2 ID tokens have been added - "i", "n" ... remove them from the array
                    this.tokens = this.tokens.slice(0, this.tokens.length - ("int".length - 1));
                    this.tokens.push(token);
                }
                else if (rTYPEBOOL.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TType, TSC.VariableType.Boolean, this.lineNumber, this.colNumber - ("boolean".length - 1));
                    // We have to remove the IDs that have been identified and added to the tokens array
                    // 6 ID tokens have been added - "b", "o", "o", "l", "e", "a" ... remove them from the array
                    this.tokens = this.tokens.slice(0, this.tokens.length - ("boolean".length - 1));
                    this.tokens.push(token);
                }
                else if (rTYPESTR.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TType, TSC.VariableType.String, this.lineNumber, this.colNumber - ("string".length - 1));
                    // We have to remove the IDs that have been identified and added to the tokens array
                    // 5 ID tokens have been added - "s", "t", "r", "i", "n" ... remove them from the array
                    this.tokens = this.tokens.slice(0, this.tokens.length - ("string".length - 1));
                    this.tokens.push(token);
                }
                else if (rDIGIT.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TDigit, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                    this.tokens.push(token);
                }
                else if (rINTOP.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TIntop, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                    this.tokens.push(token);
                }
                else if (rBOOLOPEQUALS.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    // We have to remove the assign that has been identified and added to the tokens array
                    // If say the previous token was !=, then we don't actually place this Boolop. Instead, 
                    // we place an Assign, as !== -> != and =.
                    if (this.tokens[this.tokens.length - 1].type == TSC.TokenType.TAssign) {
                        var token = new TSC.Token(TSC.TokenType.TBoolop, "==", this.lineNumber, this.colNumber);
                        this.tokens.pop();
                        this.tokens.push(token);
                    }
                    else {
                        var token = new TSC.Token(TSC.TokenType.TAssign, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                        this.tokens.push(token);
                    }
                }
                else if (rASSIGN.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TAssign, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                    this.tokens.push(token);
                }
                else if (rID.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.IdentifierToken(TSC.TokenType.TId, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber, -1);
                    this.tokens.push(token);
                }
                else if (rWHITE.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    if (rNEWLINE.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                        this.lineNumber++;
                        this.colNumber = -1;
                    }
                    this.startLexemePtr = this.endLexemePtr;
                }
                else if (rEOP.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                    var token = new TSC.Token(TSC.TokenType.TEop, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber);
                    this.tokens.push(token);
                    this.startLexemePtr = this.endLexemePtr;
                    this.foundEOP = true;
                    // Stop looking for an ending quote. The next quote found belongs to the next program
                    this.foundQuote = false;
                    // If the previous program had an error and we're now looking for the next EOP marker
                    // We've found it, so stop clearing tokens and start saving next tokens found and
                    // return them once we're done lexing
                    if (prevProgramError) {
                        this.tokens = [];
                        this.errors = [];
                        prevProgramError = false;
                        this.endLexemePtr++;
                        this.colNumber++;
                        continue;
                    }
                    // Return the results of lex and then re-init everything so we can lex next program
                    // Define an object to return values in
                    this.lexAnalysisRes = {
                        "tokens": this.tokens,
                        "errors": this.errors,
                        "warnings": this.warnings,
                        "complete": this.isComplete,
                        "line": this.lineNumber,
                        "col": this.colNumber
                    };
                    this.endLexemePtr++;
                    this.colNumber++;
                    this.tokens = [];
                    this.errors = [];
                    this.warnings = [];
                    return this.lexAnalysisRes;
                }
                else {
                    // Only catch illegal characters if we're not looking for the next EOP marker
                    if (prevProgramError) {
                        this.endLexemePtr++;
                        this.colNumber++;
                        continue;
                    }
                    if (this.endLexemePtr == sourceCode.length) {
                        // If code ends with a trailling start comment, throw error
                        if (rCOMMENTSTART.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr + 1))) {
                            this.errors.push(new TSC.Error(TSC.ErrorType.MissingCommentEnd, "*/", this.startCommentLine, this.startCommentCol));
                        }
                        else {
                            this.errors.push(new TSC.Error(TSC.ErrorType.InvalidToken, sourceCode.charAt(this.endLexemePtr - 1), this.lineNumber, this.colNumber));
                        }
                        break;
                    }
                    // Check to see if the next character creates a match for a Boolean NotEquals
                    this.endLexemePtr++;
                    if (rBOOLOPNOTEQUALS.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                        var token = new TSC.Token(TSC.TokenType.TBoolop, "!=", this.lineNumber, this.colNumber);
                        // "!" is not a valid character by itself, so the lexer would throw an error when it reaches !, 
                        // as if doesn't know that it is followed by an = yet. Perhaps we can fix this by
                        // when recognizing an illegal characters, perform a 1-place lookahead to see if there is a match with anything.
                        this.tokens.push(token);
                    }
                    else if (rCOMMENTSTART.test(sourceCode.substring(this.startLexemePtr, this.endLexemePtr))) {
                        this.inComment = true;
                        this.startCommentCol = this.colNumber;
                        this.startCommentLine = this.lineNumber;
                    }
                    else {
                        this.errors.push(new TSC.Error(TSC.ErrorType.InvalidToken, sourceCode.charAt(this.endLexemePtr - 2), this.lineNumber, this.colNumber));
                        break;
                    }
                }
                this.endLexemePtr++;
                this.colNumber++;
            }
            // If no errors were thrown during lex, check for more errors and warnings
            if (this.errors.length == 0) {
                // If we've reached the end of the source code, but no end comment has been found, throw an error
                if (this.inComment) {
                    this.errors.push(new TSC.Error(TSC.ErrorType.MissingCommentEnd, "*/", this.startCommentLine, this.startCommentCol));
                }
                else if (this.foundQuote) {
                    this.errors.push(new TSC.Error(TSC.ErrorType.MissingStringEndQuote, "\"", this.startQuoteLine, this.startQuoteCol));
                }
                else if (!this.foundEOP && this.errors.length == 0) {
                    this.warnings.push(new TSC.Warning(TSC.WarningType.MissingEOP, "$", this.lineNumber, this.colNumber));
                }
            }
            else {
                // Define an object to return values in
                this.lexAnalysisRes = {
                    "tokens": this.tokens,
                    "errors": this.errors,
                    "warnings": this.warnings,
                    "complete": this.isComplete,
                    "line": this.lineNumber,
                    "col": this.colNumber
                };
                return this.lexAnalysisRes;
            }
            // We've reached end of source code
            this.isComplete = true;
            // Define an object to return values in
            this.lexAnalysisRes = {
                "tokens": this.tokens,
                "errors": this.errors,
                "warnings": this.warnings,
                "complete": this.isComplete,
                "line": this.lineNumber,
                "col": this.colNumber
            };
            return this.lexAnalysisRes;
        };
        return Lexer;
    }());
    TSC.Lexer = Lexer;
})(TSC || (TSC = {}));
