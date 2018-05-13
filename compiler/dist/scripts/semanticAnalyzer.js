/**
 * This is the semantic analyzer, which produces an AST and performs
 * semantic analysis on the source code.
 * Validates types and scopes.
 */
var TSC;
(function (TSC) {
    var VariableType;
    (function (VariableType) {
        VariableType["Boolean"] = "boolean";
        VariableType["Int"] = "int";
        VariableType["String"] = "string";
    })(VariableType = TSC.VariableType || (TSC.VariableType = {}));
    var SemanticAnalyzer = /** @class */ (function () {
        function SemanticAnalyzer() {
            this.symbol = {}; // object to hold symbol data
            this.warnings = [];
            this.errors = [];
            this.ast = new TSC.Tree();
            this.scopeTree = new TSC.Tree();
            this.symbols = [];
            this.declaredScopes = 0;
            this.scopeLevel = -1; // set to -1 as we first increase scope level before putting into symbol table
            this.log = [];
        }
        /**
         * Starts the semantic analysis using the CST produced in parse
         */
        SemanticAnalyzer.prototype.analyze = function (parseResult) {
            // Traverse the CST in a preorder fashion
            // If we find something "important", add it to the CST
            this.traverse(parseResult.cst.root);
            // Traverse scope tree to generate warnings
            this.findWarnings(this.scopeTree.root);
            return {
                "ast": this.ast,
                "scopeTree": this.scopeTree,
                "errors": this.errors,
                "error": this.error,
                "warnings": this.warnings,
                "symbols": this.symbols,
                "log": this.log
            };
        };
        /**
         * Performs preorder traversal given a CST node
         * Creates scope tree along with AST creation
         * @return the type if any
         */
        SemanticAnalyzer.prototype.traverse = function (node) {
            // Check if "important". If so, add to AST, descend AST.
            switch (node.value) {
                case TSC.Production.Block:
                    // Scope tree: add a scope to the tree whenever we encounter a Block
                    // Increase the number of scopes that have been declared
                    // Increase the scope level as we are on a new one
                    var newScope = new TSC.ScopeNode();
                    newScope.lineNumber = node.lineNumber;
                    newScope.colNumber = node.colNumber;
                    newScope.id = this.declaredScopes;
                    this.declaredScopes++;
                    this.scopeTree.addNode(newScope);
                    this.scopeLevel++;
                    this.ast.addNode(TSC.Production.Block);
                    // Traverse node's children
                    for (var i = 0; i < node.children.length; i++) {
                        this.traverse(node.children[i]);
                    }
                    // Go up the AST once we finish traversing
                    // Don't go up if we're at the root doe. curr is the parent node
                    if (this.ast.curr != null) {
                        this.ast.ascendTree();
                    }
                    // Go up the scope tree as well as we have cleared a scope
                    // Decrease the scope level for we are going up a scope level
                    if (this.scopeTree.curr != null) {
                        this.scopeTree.ascendTree();
                        this.scopeLevel--;
                    }
                    break;
                case TSC.Production.VarDecl:
                    this.ast.addNode(TSC.Production.VarDecl);
                    // We now need to get its children and add to AST
                    // Get the type
                    var token = node.children[0].children[0].value;
                    this.ast.addNode(token.value);
                    this.ast.ascendTree();
                    // Get the id
                    var id = node.children[1].children[0].value;
                    // Set the scope on the id
                    id.scopeId = this.scopeTree.curr.value.id;
                    this.ast.addNode(id);
                    this.ast.ascendTree();
                    this.ast.ascendTree();
                    // Add variable declaration to current scope
                    // Check if already declared in current scope
                    if (!this.scopeTree.curr.value.table.hasOwnProperty(id.value)) {
                        this.scopeTree.curr.value.table[id.value] = new TSC.ScopeObject();
                        this.scopeTree.curr.value.table[id.value].value = token;
                        // Add to symbol table
                        this.symbol["type"] = token.value;
                        this.symbol["key"] = id.value;
                        this.symbol["line"] = node.children[1].children[0].lineNumber;
                        this.symbol["col"] = node.children[1].children[0].colNumber;
                        this.symbol["scope"] = this.scopeTree.curr.value.id;
                        this.symbol["scopeLevel"] = this.scopeLevel;
                        this.symbols.push(this.symbol);
                        this.symbol = {};
                    }
                    else {
                        this.error = true;
                        var err = new TSC.ScopeError(TSC.ErrorType.DuplicateVariable, id, node.children[1].children[0].lineNumber, node.children[1].children[0].colNumber, this.scopeTree.curr.value.table[id.value].value.lineNumber, this.scopeTree.curr.value.table[id.value].value.colNumber);
                        this.errors.push(err);
                    }
                    break;
                case TSC.Production.PrintStmt:
                    this.ast.addNode(TSC.Production.PrintStmt);
                    // figure out expression
                    this.traverse(node.children[2]);
                    this.ast.ascendTree();
                    break;
                case TSC.Production.AssignStmt:
                    // make the "root" an assign statement
                    this.ast.addNode(TSC.Production.AssignStmt);
                    // Get the id and also assign its scope
                    var id = node.children[0].children[0].value;
                    // Set the scope on the id
                    id.scopeId = this.scopeTree.curr.value.id;
                    this.ast.addNode(node.children[0].children[0].value);
                    // Check if id is in scope and get its type
                    var idType = this.checkScopes(node.children[0].children[0]);
                    this.ast.ascendTree();
                    // figure out the expression and get the type returned by the expression
                    var expressionType = this.traverse(node.children[2]);
                    this.ast.ascendTree();
                    // Check for type match
                    // handles case if traverse() returns a token
                    if (expressionType != null && expressionType.value != null) {
                        expressionType = expressionType.value;
                    }
                    this.checkTypeMatch(node.children[0].children[0].value, idType, expressionType, node.children[0].children[0].lineNumber, node.children[0].children[0].colNumber, node.children[2].lineNumber, node.children[2].colNumber);
                    // Update scope tree node object initialized flag. variable has been initialized.
                    this.markAsInitialized(node.children[0].children[0]);
                    break;
                case TSC.Production.WhileStmt:
                    this.ast.addNode(TSC.Production.WhileStmt);
                    this.traverse(node.children[1]);
                    this.traverse(node.children[2]);
                    this.ast.ascendTree();
                    break;
                case TSC.Production.IfStmt:
                    this.ast.addNode(TSC.Production.IfStmt);
                    this.traverse(node.children[1]);
                    this.traverse(node.children[2]);
                    this.ast.ascendTree();
                    break;
                case TSC.Production.Id:
                    // Get the id and also assign its scope
                    var id = node.children[0].value;
                    // Set the scope on the id
                    id.scopeId = this.scopeTree.curr.value.id;
                    this.ast.addNode(node.children[0].value);
                    this.ast.ascendTree();
                    // Check if variable declared in current or parent scopes
                    // If we find it in scope, return the type of the variable
                    var foundType = this.checkScopes(node.children[0]);
                    // Mark id as used
                    this.markAsUsed(node.children[0]);
                    // Look for used but uninitialized variables
                    this.checkUsedUninit(node.children[0]);
                    // return the id's type
                    return foundType;
                case TSC.Production.IntExpr:
                    // figure out which intexpr this is
                    // more than just a digit
                    if (node.children.length > 1) {
                        this.ast.addNode(new TSC.Token(TSC.TokenType.TAddition, "Addition", null, null));
                        this.ast.addNode(node.children[0].children[0].value);
                        this.ast.ascendTree();
                        // figure out expression. make sure return type is int
                        var exprType = this.traverse(node.children[2]);
                        // handles case if traverse() returns a token
                        if (exprType.value != null) {
                            exprType = exprType.value;
                        }
                        if (exprType != VariableType.Int) {
                            this.error = true;
                            this.errors.push(new TSC.TypeError(TSC.ErrorType.IncorrectIntegerExpression, node.children[2].value, node.children[2].lineNumber, node.children[2].colNumber, VariableType.Int, exprType));
                        }
                        this.ast.ascendTree();
                    }
                    else {
                        this.ast.addNode(node.children[0].children[0].value);
                        this.ast.ascendTree();
                    }
                    // return the type returned by intexpr
                    return VariableType.Int;
                case TSC.Production.BooleanExpr:
                    // figure out which boolexpr this is.
                    // more than just a boolval
                    if (node.children.length > 1) {
                        if (node.children[2].children[0].value.value == "==") {
                            this.ast.addNode(new TSC.Token(TSC.TokenType.TEquals, "TEquals", null, null));
                        }
                        else {
                            this.ast.addNode(new TSC.Token(TSC.TokenType.TNotEquals, "TNotEquals", null, null));
                        }
                        // Get types returned by the two Expr children and make sure they're the same
                        var firstExprType = this.traverse(node.children[1]);
                        var secondExprType = this.traverse(node.children[3]);
                        // handles case if traverse() returns a token
                        if (firstExprType != null && firstExprType.value != null) {
                            firstExprType = firstExprType.value;
                        }
                        if (secondExprType != null && secondExprType.value != null) {
                            secondExprType = secondExprType.value;
                        }
                        if (firstExprType != secondExprType) {
                            this.error = true;
                            this.errors.push(new TSC.TypeError(TSC.ErrorType.IncorrectTypeComparison, node.children[1].value, node.children[1].lineNumber, node.children[1].colNumber, firstExprType, secondExprType));
                        }
                        this.ast.ascendTree();
                    }
                    else {
                        this.ast.addNode(node.children[0].children[0].value);
                        this.ast.ascendTree();
                    }
                    // return the type returned by boolexpr
                    return VariableType.Boolean;
                case TSC.Production.StringExpr:
                    // we have to generate string until we reach the end of the charlist
                    // surround string in quotes
                    var stringBuilder = ["\""];
                    var currCharList = node.children[1];
                    var lastCharList = false;
                    // check for empty string. if only 2 children, we know
                    // there is an empty string, as there are only quotes
                    if (node.children.length == 2) {
                        lastCharList = true;
                    }
                    while (!lastCharList) {
                        stringBuilder.push(currCharList.children[0].children[0].value.value);
                        if (currCharList.children.length == 1) {
                            lastCharList = true;
                            continue;
                        }
                        currCharList = currCharList.children[1];
                    }
                    stringBuilder.push("\"");
                    var resString = stringBuilder.join("");
                    this.ast.addNode(new TSC.Token(TSC.TokenType.TString, resString, null, null));
                    this.ast.ascendTree();
                    // return the type returned by stringexpr
                    return VariableType.String;
                default:
                    // Traverse node's children
                    for (var i = 0; i < node.children.length; i++) {
                        // If node is an Expression, return, so we can properly
                        // return the type of the expression
                        if (node.value == TSC.Production.Expr) {
                            return this.traverse(node.children[i]);
                        }
                        this.traverse(node.children[i]);
                    }
                    break;
            }
        };
        /**
         * Checks to see if id is declared in current or parent scope
         * @param node the node whose value we're checking is in scope or not
         * @return the scope object if any
         */
        SemanticAnalyzer.prototype.checkScopes = function (node) {
            // pointer to current position in scope tree
            var ptr = this.scopeTree.curr;
            // Check current scope
            if (ptr.value.table.hasOwnProperty(node.value.value)) {
                // report our gucciness to the log
                this.log.push("VALID - Variable [" + node.value.value + "] on line " + node.lineNumber + " col " + node.colNumber + " has been declared.");
                return ptr.value.table[node.value.value].value;
            }
            else {
                while (ptr.parent != null) {
                    ptr = ptr.parent;
                    // Check if id in scope
                    if (ptr.value.table.hasOwnProperty(node.value.value)) {
                        // report our gucciness to the log
                        this.log.push("VALID - Variable [" + node.value.value + "] on line " + node.lineNumber + " col " + node.colNumber + " has been declared.");
                        return ptr.value.table[node.value.value].value;
                    }
                }
                // Didn't find id in scope, push error and return false
                this.error = true;
                var err = new TSC.ScopeError(TSC.ErrorType.UndeclaredVariable, node.value, node.lineNumber, node.colNumber, null, null);
                this.errors.push(err);
            }
        };
        /**
         * Checks to see if the id type matches its target type
         * @param idType the type of the id being assigned to
         * @param targetType the type that is being assigned to id
         */
        SemanticAnalyzer.prototype.checkTypeMatch = function (id, idType, targetType, idLine, idCol, targetLine, targetCol) {
            if (targetType != null && idType != null) {
                if (idType.value != targetType) {
                    this.error = true;
                    var err = new TSC.TypeError(TSC.ErrorType.TypeMismatch, id, idLine, idCol, idType, targetType);
                    this.errors.push(err);
                }
                else {
                    // report our gucciness to the log
                    this.log.push("VALID - Variable [" + id.value + "] of type " + idType.value + " matches its assignment type of " + targetType + " at line " + targetLine + " col " + targetCol);
                }
            }
        };
        /**
         * Traverses the scope tree in preorder fashion to find warnings to generate
         * @param node the node in tree we're starting at
         */
        SemanticAnalyzer.prototype.findWarnings = function (node) {
            // Iterate through object 
            for (var key in node.value.table) {
                // Look for declared but uninitialized variables
                if (node.value.table[key].initialized == false) {
                    // variable is uninitialized
                    this.warnings.push(new TSC.ScopeWarning(TSC.WarningType.UninitializedVariable, key, node.value.table[key].value.lineNumber, node.value.table[key].value.colNumber, node.value));
                    // if variable is uninitialized, but used, issue warning
                    // if(node.value.table[key].used == true){
                    //     this.warnings.push(new ScopeWarning(WarningType.UsedUninitialized, key, node.value.table[key].value.lineNumber, node.value.table[key].value.colNumber, node.value));
                    // }
                }
                // Look for unused variables
                if (node.value.table[key].used == false && node.value.table[key].initialized == true) {
                    // variable is unused
                    this.warnings.push(new TSC.ScopeWarning(TSC.WarningType.UnusedVariable, key, node.value.table[key].value.lineNumber, node.value.table[key].value.colNumber, node.value));
                }
            }
            // Continue traversing in preorder fashion
            for (var i = 0; i < node.children.length; i++) {
                this.findWarnings(node.children[i]);
            }
        };
        /**
         * Marks an id as initialized in current or parent scope
         * We must stop if we find in current scope, because variable can be redeclared in child scope
         * @param node the node whose value we're marking as init'd
         */
        SemanticAnalyzer.prototype.markAsInitialized = function (node) {
            // pointer to current position in scope tree
            var ptr = this.scopeTree.curr;
            // Check current scope
            if (ptr.value.table.hasOwnProperty(node.value.value)) {
                // Mark as initialized
                ptr.value.table[node.value.value].initialized = true;
                // report our gucciness to the log
                this.log.push("VALID - Variable [" + node.value.value + "] on line " + node.lineNumber + " col " + node.colNumber + " has been initialized.");
                return;
            }
            else {
                while (ptr.parent != null) {
                    ptr = ptr.parent;
                    // Check if id in scope
                    if (ptr.value.table.hasOwnProperty(node.value.value)) {
                        // Mark as initialized
                        ptr.value.table[node.value.value].initialized = true;
                        // report our gucciness to the log
                        this.log.push("VALID - Variable [" + node.value.value + "] on line " + node.lineNumber + " col " + node.colNumber + " has been initialized.");
                        return;
                    }
                }
            }
        };
        /**
         * Marks an id as used in current or parent scope
         * We must stop if we find in current scope, because variable can be redeclared in child scope
         * @param node the node whose value we're marking as init'd
         */
        SemanticAnalyzer.prototype.markAsUsed = function (node) {
            // pointer to current position in scope tree
            var ptr = this.scopeTree.curr;
            // Check current scope
            if (ptr.value.table.hasOwnProperty(node.value.value)) {
                // Mark as initialized
                ptr.value.table[node.value.value].used = true;
                // report our gucciness to the log
                this.log.push("VALID - Variable [" + node.value.value + "] on line " + node.lineNumber + " col " + node.colNumber + " has been used.");
                return;
            }
            else {
                while (ptr.parent != null) {
                    ptr = ptr.parent;
                    // Check if id in scope
                    if (ptr.value.table.hasOwnProperty(node.value.value)) {
                        // Mark as initialized
                        ptr.value.table[node.value.value].used = true;
                        // report our gucciness to the log
                        this.log.push("VALID - Variable [" + node.value.value + "] on line " + node.lineNumber + " col " + node.colNumber + " has been used.");
                        return;
                    }
                }
            }
        };
        /**
         * Checks to see if a variable is used before being initialized
         * Look for used but uninitialized variables i.e. used and then initialized. I don't wanna allow this anymore.
         * i.e. int a print(a) a = 4
         * @param node the node in tree we're starting at
         */
        SemanticAnalyzer.prototype.checkUsedUninit = function (node) {
            // pointer to current position in scope tree
            var ptr = this.scopeTree.curr;
            // Check current scope
            if (ptr.value.table.hasOwnProperty(node.value.value)) {
                if (ptr.value.table[node.value.value].initialized == false) {
                    this.warnings.push(new TSC.ScopeWarning(TSC.WarningType.UsedBeforeInit, node.value.value, node.value.lineNumber, node.value.colNumber, node.value));
                }
                return;
            }
            else {
                while (ptr.parent != null) {
                    ptr = ptr.parent;
                    // Check if id in scope
                    if (ptr.value.table.hasOwnProperty(node.value.value)) {
                        if (ptr.value.table[node.value.value].initialized == false) {
                            this.warnings.push(new TSC.ScopeWarning(TSC.WarningType.UsedBeforeInit, node.value.value, node.value.lineNumber, node.value.colNumber, node.value));
                        }
                        return;
                    }
                }
            }
        };
        /**
         * Traverses the scope tree and returns a string representation
         * @param node the node whose value we're adding to string rep
         * @param arr array of arrays that represent tree
         * @param level level of the tree we're currently at
         */
        SemanticAnalyzer.prototype.printScopeTree = function (node) {
            var tree = [];
            var level = 0;
            if (node != null) {
                this.printScopeTreeHelper(node, level, tree, "");
            }
            return tree;
        };
        SemanticAnalyzer.prototype.printScopeTreeHelper = function (node, level, tree, dash) {
            // generate string with all vars
            var varsString = "";
            for (var key in node.value.table) {
                varsString += node.value.table[key].value.value + " " + key + " | ";
            }
            tree.push(dash + " | [Scope " + node.value.id + "]: " + varsString);
            for (var i = 0; i < node.children.length; i++) {
                this.printScopeTreeHelper(node.children[i], level + 1, tree, dash + "-");
            }
        };
        return SemanticAnalyzer;
    }());
    TSC.SemanticAnalyzer = SemanticAnalyzer;
})(TSC || (TSC = {}));
