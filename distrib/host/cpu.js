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
var TSOS;
(function (TSOS) {
    var Cpu = (function () {
        function Cpu(PC, Acc, Xreg, Yreg, Zflag, isExecuting) {
            if (PC === void 0) { PC = 0; }
            if (Acc === void 0) { Acc = 0; }
            if (Xreg === void 0) { Xreg = 0; }
            if (Yreg === void 0) { Yreg = 0; }
            if (Zflag === void 0) { Zflag = 0; }
            if (isExecuting === void 0) { isExecuting = false; }
            this.PC = PC;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.isExecuting = isExecuting;
        }
        Cpu.prototype.init = function () {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        };
        Cpu.prototype.cycle = function () {
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            // Let's have a giant switch statement for the opcodes.
            // Based on program counter, get op code, do it, then set program counter accordingly
            // Also, check to make sure the PC is not out of bounds in memory
            if (!_MemoryAccessor.inBounds(this.PC)) {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(BOUNDS_ERROR, 0));
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PROCESS_EXIT, false));
            }
            else {
                var opCode = _MemoryAccessor.readMemory(this.PC);
                _Kernel.krnTrace('CPU cycle: executing ' + opCode);
                switch (opCode) {
                    case "A9":
                        // Load accumulator with decimal (but of course we display it as hex)
                        this.Acc = parseInt(_MemoryAccessor.readMemory(this.PC + 1), 16);
                        this.PC = this.PC + 2;
                        break;
                    case "AD":
                        // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                        var hexString = _MemoryAccessor.readMemory(this.PC + 1);
                        hexString = _MemoryAccessor.readMemory(this.PC + 2) + hexString;
                        // Convert it to decimal and store it in the accumulator
                        var address = parseInt(hexString, 16);
                        this.Acc = parseInt(_MemoryAccessor.readMemory(address), 16);
                        this.PC = this.PC + 3;
                        break;
                    case "8D":
                        // Gets the hex memory address to store in by looking at the next two values in memory and swapping because of little-endian format
                        var hexString = _MemoryAccessor.readMemory(this.PC + 1);
                        hexString = _MemoryAccessor.readMemory(this.PC + 2) + hexString;
                        // Convert to get the decimal address in memory
                        var address = parseInt(hexString, 16);
                        // Get the value stored in the accumulator (convert to hex string) and put it at the address in memory
                        // Also, check to see if we need to have a leading zero...only numbers below 16 need a leading zero
                        var value = this.Acc.toString(16);
                        _MemoryAccessor.writeMemory(address, value);
                        this.PC = this.PC + 3;
                        break;
                    case "6D":
                        // Gets the hex memory address to store in by looking at the next two values in memory and swapping because of little-endian format
                        var hexString = _MemoryAccessor.readMemory(this.PC + 1);
                        hexString = _MemoryAccessor.readMemory(this.PC + 2) + hexString;
                        // Convert to get the decimal address in memory
                        var address = parseInt(hexString, 16);
                        // Now, get the value stored at the address in memory, then add it to the accumulator
                        var value = _MemoryAccessor.readMemory(address);
                        this.Acc += parseInt(value, 16);
                        this.PC = this.PC + 3;
                        break;
                    case "A2":
                        // Load X register with decimal (but of course we display it as hex in memory)
                        this.Xreg = parseInt(_MemoryAccessor.readMemory(this.PC + 1), 16);
                        this.PC = this.PC + 2;
                        break;
                    case "AE":
                        // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                        var hexString = _MemoryAccessor.readMemory(this.PC + 1);
                        hexString = _MemoryAccessor.readMemory(this.PC + 2) + hexString;
                        // Convert it to decimal and use that as the address
                        var address = parseInt(hexString, 16);
                        // Convert value at address to decimal and store in X register
                        this.Xreg = parseInt(_MemoryAccessor.readMemory(address), 16);
                        this.PC = this.PC + 3;
                        break;
                    case "A0":
                        // Load Y register with decimal (but of course we display it as hex in memory)
                        this.Yreg = parseInt(_MemoryAccessor.readMemory(this.PC + 1), 16);
                        this.PC = this.PC + 2;
                        break;
                    case "AC":
                        // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                        var hexString = _MemoryAccessor.readMemory(this.PC + 1);
                        hexString = _MemoryAccessor.readMemory(this.PC + 2) + hexString;
                        // Convert it to decimal and use that as the address
                        var address = parseInt(hexString, 16);
                        this.Yreg = parseInt(_MemoryAccessor.readMemory(address), 16);
                        this.PC = this.PC + 3;
                        break;
                    case "EA":
                        // This is the NOP (no operation) op code. We don't do anything.
                        this.PC++;
                        break;
                    case "00":
                        // Execute system call for a process exit by generating software interrupt
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PROCESS_EXIT, true));
                        break;
                    case "EC":
                        // Gets the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                        var hexString = _MemoryAccessor.readMemory(this.PC + 1);
                        hexString = _MemoryAccessor.readMemory(this.PC + 2) + hexString;
                        // Convert to get the decimal address in memory
                        var address = parseInt(hexString, 16);
                        // Gets the byte from the address in memory
                        var byte = _MemoryAccessor.readMemory(address);
                        // Compare the decimal value of it to the value of the X register, set Z flag to one if equal. 
                        // Else, set it to 1.
                        if (parseInt(byte.toString(), 16) == this.Xreg) {
                            this.Zflag = 1;
                        }
                        else {
                            this.Zflag = 0;
                        }
                        this.PC = this.PC + 3;
                        break;
                    case "D0":
                        if (this.Zflag == 0) {
                            // First, get the number of bytes to branch by looking at next decimal value in memory
                            var branch = parseInt(_MemoryAccessor.readMemory(this.PC + 1), 16);
                            // Then, set the program counter to the number of bytes.
                            // If it goes beyond the limit, then loop back around to the BASE.
                            console.log("PC: " + this.PC);
                            console.log("Branch: " + branch);
                            // We have to loop back around based on the partition size.
                            // Ofc in our project, the size will always be 256
                            // But I want to implement it anyways
                            var partition = _MemoryManager.getCurrentPartition();
                            // Memory accessor does translation
                            this.PC = _MemoryAccessor.bneLoop(this.PC, branch);
                            console.log("PC IS NOW " + this.PC);
                            console.log("branched");
                        }
                        else {
                            this.PC = this.PC + 2;
                        }
                        break;
                    case "EE":
                        // Get the hex memory address by looking at the next two values in memory and swapping because of little-endian format
                        var hexString = _MemoryAccessor.readMemory(this.PC + 1);
                        hexString = _MemoryAccessor.readMemory(this.PC + 2) + hexString;
                        // Convert it to decimal, then use the result as the address for the byte to increment
                        var address = parseInt(hexString, 16);
                        // Convert the byte from hex to decimal so we can increment it
                        var byteValue = parseInt(_MemoryAccessor.readMemory(address), 16);
                        byteValue++;
                        // Then convert the byte back to hex, and set it back to that address in memory
                        var hexByteValue = byteValue.toString(16);
                        _MemoryAccessor.writeMemory(address, hexByteValue);
                        this.PC = this.PC + 3;
                        break;
                    case "FF":
                        if (this.Xreg == 1) {
                            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CONSOLE_WRITE_IR, "" + this.Yreg));
                        }
                        else if (this.Xreg == 2) {
                            var address = this.Yreg;
                            var string = "";
                            // Gets the ASCII from the address, converts it to characters, then passes to console's putText.
                            while (_MemoryAccessor.readMemory(address) != "00") {
                                var ascii = _MemoryAccessor.readMemory(address);
                                // Convert hex to decimal
                                var dec = parseInt(ascii.toString(), 16);
                                var chr = String.fromCharCode(dec);
                                string += chr;
                                address++;
                            }
                            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CONSOLE_WRITE_IR, string));
                        }
                        this.PC++;
                        break;
                    default:
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PROCESS_EXIT, false));
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(INVALID_OP, 0));
                }
                console.log(opCode + " " + this.PC + " " + this.Acc + " " + this.Xreg + " " + this.Yreg + " " + this.Zflag);
            }
        };
        return Cpu;
    }());
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
