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
        // This is called on every CPU cycle to count the number of clock 
        // cycles that the process was being executed for
        Scheduler.prototype.watch = function () {
            this.counter++;
            // If the quantum has been used up, perform a context switch
            if (this.counter == this.quantum) {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CONTEXT_SWITCH, 0));
                this.counter = 0;
            }
        };
        // This resets the counter for the number of CPU cycles that have occurred
        Scheduler.prototype.unwatch = function () {
            this.counter = 0;
        };
        // This performs the context switch
        Scheduler.prototype.contextSwitch = function () {
            TSOS.Control.hostLog("Performing context switch", "os");
            this.counter = 0;
            // Take what is running, enqueue it to the process manager's ready queue
            _ProcessManager.readyQueue.enqueue(_ProcessManager.running);
            // Take off the next item from the ready queue and set it as running.
            _ProcessManager.runProcess();
        };
        return Scheduler;
    }());
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
