///<reference path="../globals.ts" />

/* ------------
     CPU.ts

     Requires global.ts.

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Cpu {

        constructor(public PC: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public isExecuting: boolean = false) {

        }

        public init(): void {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }

        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            // Let's have a giant switch statement for the opcodes.
            // Based on program counter, get op code, do it, then increment program 

            switch(_Memory.memoryArray[this.PC]){
                case "A9": // load the accumulator with value in next area of memory
                    this.PC++;
                    // Load accumulator with decimal (but of course we display it as hex)
                    this.Acc = parseInt(_Memory.memoryArray[this.PC].toString(), 16); 
                    break;
                case "AD": // load the accumulator with a value from memory
                    this.PC++;
                    // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _Memory.memoryArray[this.PC].toString() 
                    this.PC++;
                    hexString = _Memory.memoryArray[this.PC].toString() + hexString;
                    // Convert it to integer and store it in the accumulator
                    this.Acc = parseInt(hexString, 16);
                    break;
                default:
                    console.log("opcode");
            }
            this.PC++;
            console.log(this.PC + " " + this.Acc + " " + this.Xreg + " " + this.Yreg + " " + this.Zflag);
            // Update the CPU display
            Control.hostCPU();
        }
    }
}
