/* --------
   testcases.ts

   Loads testcases into editor
   -------- */
var TSC;
(function (TSC) {
    var Testcases = /** @class */ (function () {
        function Testcases() {
        }
        Testcases.load = function (testcase) {
            switch (testcase.innerHTML) {
                case "Simple 1":
                    document.getElementById("taSourceCode").value = "/* This is a simple program with no operations */\n{}$";
                    break;
                case "Simple 2":
                    document.getElementById("taSourceCode").value = "/* Test case for print statement */\n{\n    print(\"i love compilers\")\n}$";
                    break;
                case "Regular":
                    document.getElementById("taSourceCode").value = "/* Test case for a 'regular' program*/\n{\n    int a\n    a = 1\n    print(a)\n    boolean b\n    b = true\n    print(b)\n\n    {\n        int a\n        a = 2\n        print(a)\n    }\n\n    {\n        int a\n        a = 3\n        print(a)\n    }\n\n    string s\n    s = \"stra\"\n    print(s)\n\n    s = \"strb\"\n    print(s)\n\n    if (a != 5) {\n        print(\"true\")\n    }\n\n    if (a == 5) {\n        print(\"false\")\n    }\n}$";
                    break;
                case "Multiple":
                    document.getElementById("taSourceCode").value = "/* Test case for multiple programs */\n{\n    print(\"i love compilers\")\n    int a\n    a = 2\n    string s\n    s = \"ha\"\n}$\n\n{\n    int b\n    b = 4\n    string s\n    s = \"hey\"\n}$";
                    break;
                case "All Productions thx Tien":
                    document.getElementById("taSourceCode").value = "/* Test case for all productions - thx Tien */\n{\n    /* Int Declaration */\n    int a\n    int b\n    string s\n    boolean z\n    \n    z = true\n    s = \"kai sucks\"\n\n    a = 0\n    b = 0\n\n    /* While Loop */\n    while (a != 3) {\n        print(a)\n        while (b != 3) {\n                print(b)\n                b = 1 + b\n                if (b == 2) {\n                    /* Print Statement */\n                    print(\"kai sucks\"/* This will do nothing */)\n                }\n        }\n\n        b = 0\n        a = 1 + a\n    }\n}$";
                    break;
                case "Crazy One Liner (Lex Pass)":
                    document.getElementById("taSourceCode").value = "/* Test case for crazy one liner */\n+${hellotruefalse!======trueprinta=3b=0print(\"false true\")whi33leiftruefalsestring!= stringintbooleanaa truewhileif{hi+++==!==}}/*aaahaha*/hahahahaha/*awao*/$";
                    break;
                case "Crazy One Liner Pt. 2 Thx Tien":
                    document.getElementById("taSourceCode").value = "/*Test case for all productions - thx Tien*/{/*IntDeclaration*/intaintbstringsbooleanzz=trues=\"kai sucks\"a=0b=0/*WhileLoop*/while(a!=3){print(a)while(b!=3){print(b)b=1+bif(b==2){/*PrintStatement*/print(\"kai sucks\"/*Thiswilldonothing*/)}}b=0a=1+a}}$";
                    break;
                case "WhileStatement":
                    document.getElementById("taSourceCode").value = "/* Test case for WhileStatement */\n{\n    string s\n    int a\n    a = 1\n    {\n        s = \"hey there sexy\"\n        int a\n        a = 2\n        print(a)\n    }\n    {\n        while (a != 5) {\n            a = 1 + a\n            print(a)\n        }\n        print(3 + a)\n        print(s)\n    }\n} $";
                    break;
                case "IfStatement":
                    document.getElementById("taSourceCode").value = "/* Test case for IfStatement */\n{\n    int a\n    a = 1\n    if(1 == 1){\n        print(\"nums\")\n    }\n    if(a == a){\n        print(\"ids\")\n    }\n    if(\"hey\" == \"hey\"){\n        print(\"strings\")\n    }\n    if(true == (a == a)){\n        print(\"booleans\")\n    }\n} $";
                    break;
                case "Missing EOP":
                    document.getElementById("taSourceCode").value = "/* Missing EOP */\n{\n    int b\n    b = 4\n    string s\n    s = \"hey\"\n}";
                    break;
                case "Alan":
                    document.getElementById("taSourceCode").value = "/*  Provided By \n- Compiler Tyrant\n- Alan G Labouseur\n*/\n{}$\t\n{{{{{{}}}}}}$\t\n{{{{{{}}}}}}}$\t\n{int\t@}$";
                    break;
                case "Invalid String 1":
                    document.getElementById("taSourceCode").value = "/* Test case for placing $ in quotes */\n{\n    print(\"i love com$pilers\")\n    int a\n    a = 2\n    string s\n    s = \"ha\"\n    \"\n}$";
                    break;
                case "Invalid String 2":
                    document.getElementById("taSourceCode").value = "/* Test case for invalid characters in string */\n{\n    string s\n    s = \"cookies & cream\"\n}$";
                    break;
                case "Invalid String 3":
                    document.getElementById("taSourceCode").value = "/* Test case for placing \\n in quotes */\n{\n    \"hey\n    there\"\n}$";
                    break;
                case "Invalid String 4":
                    document.getElementById("taSourceCode").value = "/* Test case for missing ending quote */\nint a\na = 4\nstring s\ns = \"hey there";
                    break;
                case "Invalid Print":
                    document.getElementById("taSourceCode").value = "/* Test case for invalid print */\n{\n    print(\"my name is 11\")\n}$";
                    break;
                case "Missing End Comment Brace":
                    document.getElementById("taSourceCode").value = "/* Test case for missing end comment brace */\n{\n    print(\"my name is eleven\")\n    /* hey i love compilers\n}$";
                    break;
                case "Invalid StatementList":
                    document.getElementById("taSourceCode").value = "/* Test case for invalid StatementList */\n{\n    4 + 2\n}$";
                    break;
                case "Invalid Expr":
                    document.getElementById("taSourceCode").value = "/* Test case for invalid Expr */\n{\n    int a\n    a = a + 2\n}$";
                    break;
                case "Invalid VarDecl":
                    document.getElementById("taSourceCode").value = "/* Test case for invalid VarDecl */\n{\n    int 4\n}$";
                    break;
                case "Invalid Print Pt. 2":
                    document.getElementById("taSourceCode").value = "/* Test case for invalid Print pt. 2 */\n{\n    print(\"$)\n}$";
                    break;
                case "Incomplete BooleanExpr":
                    document.getElementById("taSourceCode").value = "/* Test case for incomplete BooleanExpr */\n{\n    s = \"strb\"\n    print(s)\n    \n    if (a != ) {\n        print(\"true\")\n    }\n}$";
                    break;
                case "Incomplete IntExpr":
                    document.getElementById("taSourceCode").value = "/* Test case for incomplete IntExpr */\n{\n    int a\n    a = 1 +\n    print(a)\n}$";
                    break;
                case "Semantic Warnings":
                    document.getElementById("taSourceCode").value = "/* has unused and undeclared variables */\n{\n    int a\n    int b\n    a = 3\n    b = 4\n    {\n        string a\n        a = \"hey\"\n        print(a)\n        print(b)\n    }\n    print(b)\n    string s\n    {\n        boolean b\n        b = false\n    }\n    string r\n    r = \"hey\"\n    int d\n    print(d)\n    d = 3\n}$";
                    break;
                case "Undeclared Variable":
                    document.getElementById("taSourceCode").value = "/* Variables being used but not declared first */\n{\n    int a\n    b = 4\n}$";
                    break;
                case "Duplicate Variable":
                    document.getElementById("taSourceCode").value = "/* Variables being declared again in same scope*/\n{\n    int a\n    {\n        string a\n        a = \"this is fine\"\n    }\n    boolean a /* this is not fine\" */\n}$";
                    break;
                case "Type Mismatch":
                    document.getElementById("taSourceCode").value = "/* A variable's type is not compatible with its assignment*/\n{\n    string s\n    s = 4 + 3\n}$";
                    break;
                case "Incorrect Type Comparisons":
                    document.getElementById("taSourceCode").value = "/* Types do not match in Boolean comparison*/\n{\n    if(4 == false){\n        print(\"this no good\")\n    }\n    if(4 == \"hey\"){\n        print(\"int to string\")\n    }\n    if(false != \"hey\"){\n        print(\"bool to string\")\n    }\n    if(4 != 3){\n        print(\"int to int\")\n    }\n}$";
                    break;
                case "Incorrect Integer Expression":
                    document.getElementById("taSourceCode").value = "/* A digit is added to something other than a digit */\n{\nint a\na = 4 + false\n}$";
                    break;
                case "Tien Test":
                    document.getElementById("taSourceCode").value = "/* Thx Tien. */       \n{\n    int a\n    a = 0\n    string z\n    z = \"bond\"\n    while (a != 9) {\n        if (a != 5) {\n            print(\"bond\")\n        }\n        {\n            a = 1 + a\n            string b\n            b = \"james bond\"\n            print(b)\n        }\n    }\n    {/*Holy Hell This is Disgusting*/}\n    boolean c\n    c = true\n    boolean d\n    d = (true == (true == false))\n    d = (a == b)\n    d = (1 == a)\n    d = (1 != 1)\n    d = (\"string\" == 1)\n    d = (a != \"string\")\n    d = (\"string\" != \"string\")\n    if (d == true) {\n        int c\n        c = 1 + d\n        if (c == 1) {\n            print(\"ugh\")\n        }\n    }\n    while (\"string\" == a) {\n        while (1 == true) {\n            a = 1 + \"string\"\n        }\n    }\n}$";
                    break;
                case "Tien Boolean Hell":
                    document.getElementById("taSourceCode").value = "/* Thanks Tien. Assuming you get past Boolean Hell\n- there is a boolean being compared to\n- a string which will cause a type error */\n{\n    int a\n    a = 4\n    boolean b\n    b = true\n    boolean c\n    string d\n    d = \"there is no spoon\"\n    c = (d != \"there is a spoon\")\n    if(c == (false != (b == (true == (a == 3+1))))) {\n        print((b != d))\n    }\n}$";
                    break;
                case "Infinite Loop and Max Memory":
                    document.getElementById("taSourceCode").value = "/* This code segment uses the max\n- allotted memory 256 bytes \n- Also this is an infinite loop. Credit: Tien */\n{\n    int a\n    a = 1\n\n    if(\"a\" == \"a\") {\n        a = 2\n        print(\"a now is two\")\n    }\n\n    if(a != 1) {\n        a = 3\n        print(\" a now is three\")\n    }\n\n    if(a == 1) {\n        a = 3\n        print(\"this does not print\")\n    }\n    \n    while true {\n        print(\" this will always be true hahahahahahaha\")\n    }\n    \n    if false {\n        print(\"this\")\n    }\n} $";
                    break;
                case "Boolean Expressions":
                    document.getElementById("taSourceCode").value = "/* Boolean Expr Printing: This test case\n- demonstrates the compiler's ability to\n- generate code for computing the result\n- of a BooeleanExpr and printing the result\n- Result: falsefalsetruetruetruetruefalsefalsefalsetrue \n- Credit: Tien */\n{\n    boolean a\n    a = false\n    print((a == true))\n    print((true == a))\n    print((a == false))\n    print((false == a))\n    print((a != true))\n    print((true != a))\n    print((a != false))\n    print((false != a))\n    print(a)\n    if (a == false) {\n        a = true\n    }\n    print(a)\n}$";
                    break;
                case "Variable Addition":
                    document.getElementById("taSourceCode").value = "/*\nDemonstrates compiler's ability to generate code that properly handles variable addition\nCredit: Tien\n*/\n{\n    int a\n    a = 1\n    int b\n    b = 1\n    b = 1 + a\n    while (2 + a != 3 + b) {\n        a = 1 + a\n        print(\"int a is \")\n        print(a)\n        print(\" \")\n    }\n    print(\"int b is \")\n    print(b)\n}$";
                    break;
                case "Addition Checking and Long Addition":
                    document.getElementById("taSourceCode").value = "/* This statement shows that addition\n- checking and printing are both valid\n- options that can be performed. Credit: Tien\n- Result: 666addition checkfalse*/\n{\n    int a\n    while (a != 3) {\n        print(1 + 2 + 3)\n        a = 1 + a\n    }\n    if (1+1+1+1+1 == 2+3) {\n        print(\"addition check\")\n    }\n    if (1+5+3 != 8) {\n        print(false)\n    }\n} $";
                    break;
                case "Boolean Hell":
                    document.getElementById("taSourceCode").value = "/* This test case is included because it completely messed\n- up my AST with boolean hell and keeping track of boolexpr\n- may it serve as a good benchmark for those who come after \n- CREDIT: TIEN */\n{\n    int a\n    a = 0\n    boolean b\n    b = false\n    boolean c\n    c = true\n    while(((a!=9) == (\"test\" != \"alan\")) == ((5==5) != (b == c))) {\n        print(\"a\")\n        string d\n        d = \"yes\"\n        print(d)\n        {\n            int a\n            a = 5\n        }\n    }\n}$";
                    break;
                case "Max Memory":
                    document.getElementById("taSourceCode").value = "/* Valid code but can't fit into 256 bytes */\n{\n    int a\n    int b\n    int c\n    int d\n    a = 2\n    {\n        b = 5\n        print(b)\n        a = 1 + a\n        {\n            print(a)\n            a = 5\n        }\n        if(a == b) {\n            print(\"wowza\")\n        }\n        int d\n        d = 5\n        {\n            string d\n            d = \"hey\"\n            print(d)\n            d = \"sap\"\n            print(d)\n        }\n        print(d)\n    }\n    c = 4\n    print(c)\n    while (c != 7) {\n        c = 1 + 1 + 1 + c\n        print(c)\n    }\n    c = 9 + c\n    print(c)\n}$";
                    break;
            }
            document.getElementById("taOutput").value = "Inserted Program: " + testcase.innerHTML;
        };
        return Testcases;
    }());
    TSC.Testcases = Testcases;
})(TSC || (TSC = {}));
