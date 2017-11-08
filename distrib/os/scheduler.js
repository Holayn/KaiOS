/* ------------
   scheduler.ts

   This is the client OS implementation of a scheduler.
   This does the appropriate context switching for processes
   using a Round Robin scheduling scheme.
   ------------ */
var TSOS;
(function (TSOS) {
    var Scheduler = (function () {
        function Scheduler() {
            this.counter = 0;
            this.quantum = 6; // Number of clock ticks until context switch for process
        }
        return Scheduler;
    }());
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
