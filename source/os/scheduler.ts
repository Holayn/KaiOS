/* ------------
   scheduler.ts

   This is the client OS implementation of a scheduler.
   This does the appropriate context switching for processes
   using a Round Robin scheduling scheme.
   ------------ */

module TSOS {
    export class Scheduler {
        public counter: number;
        public quantum: number;
        constructor() {
            this.counter = 0;
            this.quantum = 6; // Number of clock ticks until context switch for process
        }
        // This is called on every CPU cycle to count the number of clock 
        // cycles that the process was being executed for
        public watch() {
            this.counter++;
            // If the quantum has been used up, perform a context switch
            if(this.counter == this.quantum){
                _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH, 0));
                this.counter = 0;
            }
        }
        // This resets the counter for the number of CPU cycles that have occurred
        public unwatch() {
            this.counter = 0;
        }
        // This sets the quantum to the parameter passed
        public setQuantum(num) {
            this.quantum = num;
        }
        // This performs the context switch
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
    }
}
