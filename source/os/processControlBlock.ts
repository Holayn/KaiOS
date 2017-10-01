/* ------------
   processControlBlock.ts

   This is the client OS implementation of a PCB
   ------------ */

   module TSOS {
    export class ProcessControlBlock {
        // constructor(public State: string,
        //             public Pid: number,
        //             public PC: number,
        //             public IR: number, 
        //             public Acc: number, 
        //             public Xreg: number,
        //             public Yreg: number,
        //             public Zflag: number,
        //             public Base: number,
        //             public Limit: number
        //  ){}
        public State: string;
        public Pid: number;
        public PC: number;
        public IR: number; 
        public Acc: number; 
        public Xreg: number;
        public Yreg: number;
        public Zflag: number;
        public Base: number;
        public Limit: number;
        constructor(public processId){
            this.Pid = processId;
        }
        
        // Set everything to 0
        public init(base, limit): void {
            this.State = "Waiting";
            this.PC = 0;
            this.IR = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.Base = base;
            this.Limit = limit;
        }
    }
}
