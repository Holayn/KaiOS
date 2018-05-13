var TSC;
(function (TSC) {
    // these make up the value of the key:value pair in the table in the ScopeNode
    var ScopeObject = /** @class */ (function () {
        function ScopeObject() {
            this.initialized = false;
            this.used = false;
        }
        return ScopeObject;
    }());
    TSC.ScopeObject = ScopeObject;
    // makes up the scope tree
    var ScopeNode = /** @class */ (function () {
        function ScopeNode() {
            this.table = {};
        }
        return ScopeNode;
    }());
    TSC.ScopeNode = ScopeNode;
})(TSC || (TSC = {}));
