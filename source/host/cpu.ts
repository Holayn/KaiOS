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
            var opCode = _Memory.memoryArray[this.PC];
            switch(opCode){
                case "A9": // load the accumulator with value in next area of memory
                    // Load accumulator with decimal (but of course we display it as hex)
                    this.Acc = parseInt(_Memory.memoryArray[this.PC+1].toString(), 16); 
                    break;
                case "AD": // load the accumulator with a value from memory
                    // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _Memory.memoryArray[this.PC+1].toString() 
                    hexString = _Memory.memoryArray[this.PC+2].toString() + hexString;
                    // Convert it to decimal and store it in the accumulator
                    this.Acc = parseInt(hexString, 16);
                    break;
                case "8D": // store the accumulator in memory
                    // Gets the hex memory address to store in by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _Memory.memoryArray[this.PC+1].toString() 
                    hexString = _Memory.memoryArray[this.PC+2].toString() + hexString;
                    // Convert to get the decimal address in memory
                    var address = parseInt(hexString, 16);
                    // Get the value stored in the accumulator (convert to hex string) and put it at the address in memory
                    // Also, check to see if we need to have a leading zero...only numbers below 16 need a leading zero
                    var value = this.Acc.toString(16);
                    _Memory.memoryArray[address] = value;
                    break;
                case "6D": // add with carry (add contents of address to accumulator and store result in accumulator)
                    // Gets the hex memory address to store in by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _Memory.memoryArray[this.PC+1].toString() 
                    hexString = _Memory.memoryArray[this.PC+2].toString() + hexString;
                    // Convert to get the decimal address in memory
                    var address = parseInt(hexString, 16);
                    // Now, get the value stored at the address in memory, then add it to the accumulator
                    var value = _Memory.memoryArray[address];
                    this.Acc += parseInt(value, 16);
                    break;
                case "A2": // load the X register with a constant
                    // Load X register with decimal (but of course we display it as hex in memory)
                    this.Xreg = parseInt(_Memory.memoryArray[this.PC+1].toString(), 16); 
                    break;
                case "AE": // load the X register from memory
                    // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _Memory.memoryArray[this.PC+1].toString() 
                    hexString = _Memory.memoryArray[this.PC+2].toString() + hexString;
                    // Convert it to decimal and store it in the x register
                    this.Xreg = parseInt(hexString, 16);
                    break;
                case "A0": // load the Y register with a constant
                    // Load Y register with decimal (but of course we display it as hex in memory)
                    this.Yreg = parseInt(_Memory.memoryArray[this.PC+1].toString(), 16); 
                    break;
                case "AC": // load the Y register from memory
                    // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _Memory.memoryArray[this.PC+1].toString() 
                    hexString = _Memory.memoryArray[this.PC+2].toString() + hexString;
                    // Convert it to decimal and store it in the y register
                    this.Yreg = parseInt(hexString, 16);
                    break;
                case "EA": // no operation
                    // This is the NOP (no operation) op code. We don't do anything.
                    break;
                case "00": // break (system call)
                    // Call the break system call
                    _Kernel.krnExitProcess();
                    break;
                case "EC": // compare byte in memory to X register. Sets the Z flag to zero if equal
                    // Gets the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _Memory.memoryArray[this.PC+1].toString() 
                    hexString = _Memory.memoryArray[this.PC+2].toString() + hexString;
                    // Convert to get the decimal address in memory
                    var address = parseInt(hexString, 16);
                    // Gets the byte from the address in memory
                    var byte = _Memory.memoryArray[address];
                    // Compare the value of it to the hex value of the X register, set Z flag to zero if equal. 
                    // Else, set it to 1.
                    if(byte == this.Xreg.toString(16)){
                        this.Zflag = 0;
                    }
                    else{
                        this.Zflag = 1;
                    }
                    break;
                case "D0": // branch n bytes if Z flag = 0
                    if(this.Zflag == 0){
                        // First, get the number of bytes to branch by looking at next value in memory
                        var branch = parseInt(_Memory.memoryArray[this.PC+1].toString(), 16); 
                        // Then, set the program counter to the number of bytes.
                        // Decrement the PC by one, because we need to evaluate the op code at n bytes.
                        // This is due to the fact that we increment the PC with every cycle.
                        this.PC = branch;
                        this.PC--;
                    }
                    break;
                case "EE": // Increment the value of a byte
                    // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _Memory.memoryArray[this.PC+1].toString() 
                    hexString = _Memory.memoryArray[this.PC+2].toString() + hexString;
                    // Convert it to decimal, then use the result as the address for the byte to increment
                    var address = parseInt(hexString, 16);
                    // Convert the byte from hex to decimal
                    var byteValue = parseInt(_Memory.memoryArray[address], 16);
                    byteValue++;
                    // Then set the incremented byte back to that address in memory
                    _Memory.memoryArray[address] = byteValue;
                    break;
                case "FF": // System call: if 1 in X reg, make syscall to print integer store in Y reg. if 2, then print 00-terminated string stored at address in Y register.
            }
            // If there was not a break, then increment the program counter
            // If we increment the PC after a break, the CPU will incorrectly display a PC value of 1.
            if(opCode !== "00"){
                this.PC++;
            }
            console.log(this.PC + " " + this.Acc + " " + this.Xreg + " " + this.Yreg + " " + this.Zflag);
            // Update the CPU display
            Control.hostCPU();
            // Update the memory display
            Control.hostMemory();
        }
    }
}
