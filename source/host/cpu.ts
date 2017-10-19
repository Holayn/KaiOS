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
            // Update the CPU display
            Control.hostCPU();
        }

        public cycle(): void {
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            // Let's have a giant switch statement for the opcodes.
            // Based on program counter, get op code, do it, then set program counter accordingly
            let opCode = _MemoryManager.readMemory(this.PC);
            _Kernel.krnTrace('CPU cycle: executing ' + opCode);
            switch(opCode){
                case "A9": // load the accumulator with value in next area of memory
                    // Load accumulator with decimal (but of course we display it as hex)
                    this.Acc = parseInt(_MemoryManager.readMemory(this.PC+1), 16); 
                    this.PC = this.PC+2;
                    break;
                case "AD": // load the accumulator with a value from memory
                    // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _MemoryManager.readMemory(this.PC+1); 
                    hexString = _MemoryManager.readMemory(this.PC+2) + hexString;
                    // Convert it to decimal and store it in the accumulator
                    var address = parseInt(hexString, 16);
                    this.Acc = _MemoryManager.readMemory(address);
                    this.PC = this.PC+3;
                    break;
                case "8D": // store the accumulator in memory
                    // Gets the hex memory address to store in by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _MemoryManager.readMemory(this.PC+1) 
                    hexString = _MemoryManager.readMemory(this.PC+2) + hexString;
                    // Convert to get the decimal address in memory
                    var address = parseInt(hexString, 16);
                    // Get the value stored in the accumulator (convert to hex string) and put it at the address in memory
                    // Also, check to see if we need to have a leading zero...only numbers below 16 need a leading zero
                    var value = this.Acc.toString(16);
                    _MemoryManager.writeMemory(address, value);
                    this.PC = this.PC+3;
                    break;
                case "6D": // add with carry (add contents of address to accumulator and store result in accumulator)
                    // Gets the hex memory address to store in by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _MemoryManager.readMemory(this.PC+1);
                    hexString = _MemoryManager.readMemory(this.PC+2) + hexString;
                    // Convert to get the decimal address in memory
                    var address = parseInt(hexString, 16);
                    // Now, get the value stored at the address in memory, then add it to the accumulator
                    var value = _MemoryManager.readMemory(address);
                    this.Acc += parseInt(value, 16);
                    this.PC = this.PC+3;
                    break;
                case "A2": // load the X register with a constant
                    // Load X register with decimal (but of course we display it as hex in memory)
                    this.Xreg = parseInt(_MemoryManager.readMemory(this.PC+1), 16); 
                    this.PC = this.PC+2;
                    break;
                case "AE": // load the X register from memory
                    // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _MemoryManager.readMemory(this.PC+1); 
                    hexString = _MemoryManager.readMemory(this.PC+2) + hexString;
                    // Convert it to decimal and use that as the address
                    var address = parseInt(hexString, 16);
                    // Convert value at address to decimal and store in X register
                    this.Xreg = parseInt(_MemoryManager.readMemory(address), 16);
                    this.PC = this.PC+3;
                    break;
                case "A0": // load the Y register with a constant
                    // Load Y register with decimal (but of course we display it as hex in memory)
                    this.Yreg = parseInt(_MemoryManager.readMemory(this.PC+1), 16); 
                    this.PC = this.PC+2;
                    break;
                case "AC": // load the Y register from memory
                    // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _MemoryManager.readMemory(this.PC+1);
                    hexString = _MemoryManager.readMemory(this.PC+2) + hexString;
                    // Convert it to decimal and use that as the address
                    var address = parseInt(hexString, 16);
                    this.Yreg = parseInt(_MemoryManager.readMemory(address), 16);
                    this.PC = this.PC+3;
                    break;
                case "EA": // no operation
                    // This is the NOP (no operation) op code. We don't do anything.
                    this.PC++;
                    break;
                case "00": // break (system call)
                    // Execute system call for a process exit by generating software interrupt
                    _KernelInterruptQueue.enqueue(new Interrupt(PROCESS_EXIT, 0));
                    break;
                case "EC": // compare byte in memory to X register. Sets the Z flag to zero if equal
                    // Gets the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _MemoryManager.readMemory(this.PC+1);
                    hexString = _MemoryManager.readMemory(this.PC+2) + hexString;
                    // Convert to get the decimal address in memory
                    var address = parseInt(hexString, 16);
                    // Gets the byte from the address in memory
                    var byte = _MemoryManager.readMemory(address);
                    // Compare the decimal value of it to the value of the X register, set Z flag to one if equal. 
                    // Else, set it to 1.
                    if(parseInt(byte.toString(), 16) == this.Xreg){
                        this.Zflag = 1;
                    }
                    else{
                        this.Zflag = 0;
                    }
                    this.PC = this.PC+3;
                    break;
                case "D0": // branch n bytes if Z flag = 0
                    if(this.Zflag == 0){
                        // First, get the number of bytes to branch by looking at next decimal value in memory
                        var branch = parseInt(_MemoryManager.readMemory(this.PC+1), 16); 
                        // Then, set the program counter to the number of bytes.
                        // If it goes beyond the limit, then loop back around.
                        console.log("PC: " + this.PC);
                        console.log("Branch: " + branch);
                        this.PC = (this.PC + branch + 2)%256;
                        console.log("PC IS NOW " + this.PC);
                        console.log("branched");
                    }
                    else{
                        this.PC = this.PC+2;
                    }
                    break;
                case "EE": // Increment the value of a byte
                    // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                    var hexString = _MemoryManager.readMemory(this.PC+1);
                    hexString = _MemoryManager.readMemory(this.PC+2) + hexString;
                    // Convert it to decimal, then use the result as the address for the byte to increment
                    var address = parseInt(hexString, 16);
                    // Convert the byte from hex to decimal so we can increment it
                    var byteValue = parseInt(_MemoryManager.readMemory(address), 16);
                    byteValue++;
                    // Then convert the byte back to hex, and set it back to that address in memory
                    var hexByteValue = byteValue.toString(16);
                    _MemoryManager.writeMemory(address, hexByteValue);
                    this.PC = this.PC+3;
                    break;
                case "FF": // System call: if 1 in X reg, make syscall to print integer store in Y reg. if 2, then print 00-terminated string stored at address in Y register.
                    if(this.Xreg == 1){
                        _KernelInterruptQueue.enqueue(new Interrupt(CONSOLE_WRITE_IR, ""+this.Yreg))
                    }
                    else if(this.Xreg == 2){
                        var address = this.Yreg;
                        var string = "";
                        // Gets the ASCII from the address, converts it to characters, then passes to console's putText.
                        while(_Memory.memoryArray[address] != "00"){
                            var ascii = _MemoryManager.readMemory(address);
                            // Convert hex to decimal
                            var dec = parseInt(ascii.toString(), 16);
                            var chr = String.fromCharCode(dec);
                            string += chr;
                            address++;
                        }
                        _KernelInterruptQueue.enqueue(new Interrupt(CONSOLE_WRITE_IR, string))
                    }
                    this.PC++;
                    break;
                default: // If the op code is invalid, exit the process
                    _KernelInterruptQueue.enqueue(new Interrupt(PROCESS_EXIT, 0));
                    _KernelInterruptQueue.enqueue(new Interrupt(CONSOLE_WRITE_IR, "Invalid op code, exiting..."));
            }
            console.log(opCode + " " + this.PC + " " + this.Acc + " " + this.Xreg + " " + this.Yreg + " " + this.Zflag);
            // Update the CPU display
            Control.hostCPU();
            // Update the memory display
            Control.hostMemory();
        }
    }
}
