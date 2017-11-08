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
        // LOG ALL SCHEDULING EVENTS
        // Control.hostLog(msg, "OS");

    }
}
