/**
 * This is the Token class and TokenType enumeration, which represents
 * the Token object that is used to store information about the tokens
 * generated during lexical analysis.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var TSC;
(function (TSC) {
    var TokenType;
    (function (TokenType) {
        TokenType["TId"] = "TId";
        TokenType["TLbrace"] = "TLbrace";
        TokenType["TRbrace"] = "TRbrace";
        TokenType["TEop"] = "TEop";
        TokenType["TDigit"] = "TDigit";
        TokenType["TIntop"] = "TIntop";
        TokenType["TBoolval"] = "TBoolval";
        TokenType["TType"] = "TType";
        TokenType["TAssign"] = "TAssign";
        TokenType["TBoolop"] = "TBoolop";
        TokenType["TWhile"] = "TWhile";
        TokenType["TIf"] = "TIf";
        TokenType["TPrint"] = "TPrint";
        TokenType["TRparen"] = "TRparen";
        TokenType["TLparen"] = "TLparen";
        TokenType["TQuote"] = "TQuote";
        TokenType["TChar"] = "TChar";
        TokenType["TSpace"] = "TSpace";
        TokenType["TString"] = "String";
        TokenType["TAddition"] = "Addition";
        TokenType["TEquals"] = "Equals";
        TokenType["TNotEquals"] = "NotEquals";
    })(TokenType = TSC.TokenType || (TSC.TokenType = {}));
    var Token = /** @class */ (function () {
        function Token(tokenType, value, lineNumber, colNumber) {
            this.type = tokenType;
            this.value = value;
            this.lineNumber = lineNumber;
            this.colNumber = colNumber;
        }
        return Token;
    }());
    TSC.Token = Token;
    /**
     * This class is a special kind of Token for identifiers, which will keep track
     * of what scope the identifier is in
     */
    var IdentifierToken = /** @class */ (function (_super) {
        __extends(IdentifierToken, _super);
        function IdentifierToken(tokenType, value, lineNumber, colNumber, scopeId) {
            var _this = _super.call(this, tokenType, value, lineNumber, colNumber) || this;
            _this.scopeId = scopeId;
            return _this;
        }
        return IdentifierToken;
    }(Token));
    TSC.IdentifierToken = IdentifierToken;
})(TSC || (TSC = {}));
