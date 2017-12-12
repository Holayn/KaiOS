/* ------------
   scheduler.ts

   This is the client OS implementation of a scheduler.
   This does the appropriate context switching for processes
   using a Round Robin scheduling scheme.
   ------------ */

module TSOS {
    export class Scheduler {
        public algorithm: string; // algorithm currently being run
        public counter: number;
        public quantum: number;
        constructor() {
            this.counter = 0;
            this.quantum = 6; // Number of clock ticks until context switch for process
            this.algorithm = ROUND_ROBIN; // set the scheduling algorithm to round robin
        }

        /**
         * This is called on every CPU cycle to watch processes being executed and perform the designated
         * scheduling algorithm's task
         */
        public watch() {
            // Don't actually do context switching if there is nothing in the ready queue
            // Why invoke additional overhead?
            if(_ProcessManager.readyQueue.getSize() > 0){
                // Depending on the scheduling algorithm, do something
                // ROUND ROBIN
                if(this.algorithm == ROUND_ROBIN){
                    this.counter++;
                    // If the quantum has been used up, perform a context switch
                    if(this.counter == this.quantum){
                        _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH, 0));
                        this.counter = 0;
                    }
                }
                if(this.algorithm == FCFS){
                    this.counter++;
                    // If the quantum has been used up, perform a context switch
                    if(this.counter == this.quantum){
                        _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH, 0));
                        this.counter = 0;
                    }
                }
                if(this.algorithm == PRIORITY){
                    
                }
            }
        }

        /**
         * This resets the counter for the number of CPU cycles that have occurred
         */
        public unwatch() {
            this.counter = 0;
        }

        /**
         * This sets the Round Robin quantum to the parameter passed
         * @param num the quantum
         */
        public setQuantum(num) {
            this.quantum = num;
        }

        /**
         * This performs the context switch
         */
        public contextSwitch() {
            Control.hostLog("Performing context switch", "os");
            // We need to update the PCB
            _ProcessManager.updatePCB();
            this.counter = 0;
            // Take what is running, enqueue it to the process manager's ready queue
            _ProcessManager.readyQueue.enqueue(_ProcessManager.running);
            // Take off the next item from the ready queue and set it as running.
            _ProcessManager.runProcess();
        }

        /**
         * Sets the scheduling algorithm
         */
        public setAlgorithm(algorithm: String) {
            switch (algorithm) {
                case ROUND_ROBIN:
                    break;
                case FCFS:
                    // FCFS is simply round robin with a uuuuuuuuuuuuuuuuuuuuuuuuuuuuuge quantum
                    this.quantum = 999999;
                    break;
                case PRIORITY:
                    break;
                default:
                    return false;
            }
            return true;
        }
    }
}
