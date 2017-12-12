/* ------------
   scheduler.ts

   This is the client OS implementation of a scheduler.
   This does the appropriate context switching for processes
   using a Round Robin scheduling scheme.
   ------------ */
var TSOS;
(function (TSOS) {
    var Scheduler = /** @class */ (function () {
        function Scheduler() {
            this.counter = 0;
            this.quantum = 6; // Number of clock ticks until context switch for process
            this.algorithm = ROUND_ROBIN; // set the scheduling algorithm to round robin
        }
        /**
         * This is called on every CPU cycle to watch processes being executed and perform the designated
         * scheduling algorithm's task
         */
        Scheduler.prototype.watch = function () {
            // Don't actually do context switching if there is nothing in the ready queue
            // Why invoke additional overhead?
            if (_ProcessManager.readyQueue.getSize() > 0) {
                // Depending on the scheduling algorithm, do something
                // ROUND ROBIN
                if (this.algorithm == ROUND_ROBIN) {
                    this.counter++;
                    // If the quantum has been used up, perform a context switch
                    if (this.counter == this.quantum) {
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CONTEXT_SWITCH, 0));
                        this.counter = 0;
                    }
                }
                if (this.algorithm == FCFS) {
                    this.counter++;
                    // If the quantum has been used up, perform a context switch
                    if (this.counter == this.quantum) {
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CONTEXT_SWITCH, 0));
                        this.counter = 0;
                    }
                }
                if (this.algorithm == PRIORITY) {
                    // We don't actually do anything here. We will implement priority scheduling such that
                    // every time a process is run, the ready queue is reordered such that items with higher priority come first.
                }
            }
        };
        /**
         * This resets the counter for the number of CPU cycles that have occurred
         */
        Scheduler.prototype.unwatch = function () {
            this.counter = 0;
        };
        /**
         * Finds and returns the PCB in the ready queue with the highest priority
         * Also removes the PCB from the ready queue
         */
        Scheduler.prototype.findHighestPriority = function () {
            var res;
            var size = _ProcessManager.readyQueue.getSize();
            for (var i = 0; i < size; i++) {
                var pcb = _ProcessManager.readyQueue.dequeue();
                if (res == null) {
                    res = pcb;
                }
                else {
                    if (pcb.Priority < res.Priority) {
                        _ProcessManager.readyQueue.enqueue(res); // put the process back into the ready queue
                        res = pcb;
                    }
                    else {
                        _ProcessManager.readyQueue.enqueue(pcb);
                    }
                }
            }
            return res;
        };
        /**
         * This sets the Round Robin quantum to the parameter passed
         * @param num the quantum
         */
        Scheduler.prototype.setQuantum = function (num) {
            this.quantum = num;
        };
        /**
         * This performs the context switch
         */
        Scheduler.prototype.contextSwitch = function () {
            TSOS.Control.hostLog("Performing context switch", "os");
            // We need to update the PCB
            _ProcessManager.updatePCB();
            this.counter = 0;
            // Take what is running, enqueue it to the process manager's ready queue
            _ProcessManager.readyQueue.enqueue(_ProcessManager.running);
            // Take off the next item from the ready queue and set it as running.
            _ProcessManager.runProcess();
        };
        /**
         * Sets the scheduling algorithm
         */
        Scheduler.prototype.setAlgorithm = function (algorithm) {
            switch (algorithm) {
                case ROUND_ROBIN:
                    this.algorithm = ROUND_ROBIN;
                    break;
                case FCFS:
                    // FCFS is simply round robin with a uuuuuuuuuuuuuuuuuuuuuuuuuuuuuge quantum
                    this.algorithm = FCFS;
                    this.quantum = 999999;
                    break;
                case PRIORITY:
                    this.algorithm = PRIORITY;
                    break;
                default:
                    return false;
            }
            return true;
        };
        return Scheduler;
    }());
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
