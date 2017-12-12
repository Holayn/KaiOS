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
        ProcessControlBlock.prototype.init = function (partition) {
            this.State = "Ready";
            this.PC = 0;
            this.IR = "00";
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.Partition = partition;
            this.turnAroundTime = 0;
            this.waitTime = 0;
            this.Swapped = false;
            this.TSB = "0:0:0";
            this.Priority = 1;
        };
        return ProcessControlBlock;
    }());
    TSOS.ProcessControlBlock = ProcessControlBlock;
})(TSOS || (TSOS = {}));
