/* ------------
   processControlBlock.ts

   This is the client OS implementation of a PCB
   ------------ */

   module TSOS {
    export class ProcessControlBlock {
        public State: string;
        public Pid: number;
        public PC: number;
        public IR: String; 
        public Acc: number; 
        public Xreg: number;
        public Yreg: number;
        public Zflag: number;
        public Partition: number;
        // This tracks turnaround and waittime for each process
        public turnAroundTime: number;
        public waitTime: number;
        constructor(public processId){
            this.Pid = processId;
        }
        
        // Set everything to 0
        public init(partition): void {
            this.State = "Waiting";
            this.PC = 0;
            this.IR = "00";
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.Partition = partition;
            this.turnAroundTime = 0;
            this.waitTime = 0;
        }
    }
}
