/* ------------
   processControlBlock.ts

   This is the client OS implementation of a PCB
   ------------ */
var TSOS;
(function (TSOS) {
    var ProcessControlBLock = /** @class */ (function () {
        function ProcessControlBLock(State, Pid, PC, IR, Acc, Xreg, Yreg, Zflag, Base, Limit) {
            this.State = State;
            this.Pid = Pid;
            this.PC = PC;
            this.IR = IR;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.Base = Base;
            this.Limit = Limit;
        }
        // Set everything to 0
        ProcessControlBLock.prototype.init = function () {
            this.State = "";
            this.Pid = 0;
            this.PC = 0;
            this.IR = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.Base = 0;
            this.Limit = 0;
        };
        return ProcessControlBLock;
    }());
    TSOS.ProcessControlBLock = ProcessControlBLock;
})(TSOS || (TSOS = {}));
