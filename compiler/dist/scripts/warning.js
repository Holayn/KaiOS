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
/**
 * Class and Enumeration for Warning that holds information
 * about different types of warnings that may be generated when
 * compiling source code.
 */
var TSC;
(function (TSC) {
    var WarningType;
    (function (WarningType) {
        WarningType["MissingEOP"] = "MissingEOP";
        WarningType["UninitializedVariable"] = "UninitializedVariable";
        WarningType["UnusedVariable"] = "UnusedVariable";
        WarningType["UsedUninitialized"] = "UsedUninitialized";
        WarningType["UsedBeforeInit"] = "UsedBeforeInit";
    })(WarningType = TSC.WarningType || (TSC.WarningType = {}));
    var Warning = /** @class */ (function () {
        function Warning(tokenType, value, lineNumber, colNumber) {
            this.type = tokenType;
            this.value = value;
            this.lineNumber = lineNumber;
            this.colNumber = colNumber;
        }
        return Warning;
    }());
    TSC.Warning = Warning;
    var ScopeWarning = /** @class */ (function (_super) {
        __extends(ScopeWarning, _super);
        function ScopeWarning(tokenType, value, lineNumber, colNumber, node) {
            var _this = _super.call(this, tokenType, value, lineNumber, colNumber) || this;
            _this.scopeLine = node.lineNumber;
            _this.scopeCol = node.colNumber;
            _this.scopeId = node.id;
            return _this;
        }
        return ScopeWarning;
    }(Warning));
    TSC.ScopeWarning = ScopeWarning;
})(TSC || (TSC = {}));
