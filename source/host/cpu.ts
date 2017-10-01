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
                    // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    this.PC++;
                    var hexString = _Memory.memoryArray[this.PC].toString() 
                    this.PC++;
                    hexString = _Memory.memoryArray[this.PC].toString() + hexString;
                    // Convert it to integer and store it in the accumulator
                    this.Acc = parseInt(hexString, 16);
                    break;
                case "8D": // store the accumulator in memory
                    // Gets the hex memory address to store in by looking at the next two values in memory and swapping because of little-endian format
                    this.PC++;
                    var hexString = _Memory.memoryArray[this.PC].toString() 
                    this.PC++;
                    hexString = _Memory.memoryArray[this.PC].toString() + hexString;
                    // Convert to get the integer address in memory
                    var address = parseInt(hexString, 16);
                    console.log("Address:" + address);
                    // Get the value stored in the accumulator (convert to hex string) and put it at the address in memory
                    // Also, check to see if we need to have a leading zero...only numbers below 16 need a leading zero
                    var value = this.Acc.toString(16).substr(-2);
                    if(this.Acc < 16){
                        value = "0" + value;
                    }
                    console.log("Value:" + value);
                    _Memory.memoryArray[address] = value;
                    break;
                case "6D": // add with carry (add contents of address to accumulator and store result in accumulator)
                case "A2": // load the X register with a constant
                case "AE": // load the X register from memory
                case "A0": // load the Y register with a constant
                case "AC": // load the Y register from memory
                case "EA": // no operation
                case "00": // break (system call)
                case "EC": // compare byte in memory to X register. Sets the Z flag to zero if equal
                case "D0": // branch n bytes if Z flag = 0
                case "EE": // Increment the value of a byte
                case "FF": // System call: if 1 in X reg, make syscall to print integer store in Y reg. if 2, then print 00-terminated string stored at address in Y register.
            }
            this.PC++;
            console.log(this.PC + " " + this.Acc + " " + this.Xreg + " " + this.Yreg + " " + this.Zflag);
            // Update the CPU display
            Control.hostCPU();
            // Update the memory display
            Control.hostMemory();
        }
    }
}
