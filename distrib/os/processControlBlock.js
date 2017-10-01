/* ------------
   processControlBlock.ts

   This is the client OS implementation of a PCB
   ------------ */
var TSOS;
(function (TSOS) {
    var ProcessControlBlock = /** @class */ (function () {
        function ProcessControlBlock(processId) {
            this.processId = processId;
            this.Pid = processId;
        }
        // Set everything to 0
        ProcessControlBlock.prototype.init = function (base, limit) {
            this.State = "Waiting";
            this.PC = 0;
            this.IR = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.Base = base;
            this.Limit = limit;
        };
        return ProcessControlBlock;
    }());
    TSOS.ProcessControlBlock = ProcessControlBlock;
})(TSOS || (TSOS = {}));
