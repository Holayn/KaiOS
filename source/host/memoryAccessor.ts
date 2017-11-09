///<reference path="../globals.ts" />
///<reference path="../os/interrupt.ts" />

/* ------------
     memoryAccesor.ts

     Requires global.ts.

     Does memory translation and enforces memory out of bounds issues.

     Routines for the host memory accessor simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class MemoryAccessor {

        constructor() {}

        // This reads the memory based on a given address in memory
        // Returns the hex string value stored in memory
        // Enforce memory out of bounds rule
        // Also do address translation!
        public readMemory(addr): string {
            if(this.inBounds(addr)){
                var partition = _ProcessManager.running.Partition;
                // console.log(_MemoryManager.partitions[partition].base);
                // console.log(addr);
                return _Memory.memoryArray[_MemoryManager.partitions[partition].base + addr].toString();
            }
            else{
                _KernelInterruptQueue.enqueue(new Interrupt(BOUNDS_ERROR, 0));
                _KernelInterruptQueue.enqueue(new Interrupt(PROCESS_EXIT, false));
            }
            
        }

        // This writes to memory based on an address and value given
        // Enforce memory out of bounds rule
        // Also do address translation!
        public writeMemory(addr, value): void {
            if(this.inBounds(addr)){
                if(parseInt(value, 16) < 16){
                    value = "0" + value;
                }
                var partition = _ProcessManager.running.Partition;
                _Memory.memoryArray[_MemoryManager.partitions[partition].base + addr] = value;
            }
            else{
                _KernelInterruptQueue.enqueue(new Interrupt(BOUNDS_ERROR, 0));
                _KernelInterruptQueue.enqueue(new Interrupt(PROCESS_EXIT, false));
            }
        }

        // Checks to make sure the memory being accessed is within the range specified by the base/limit
        // Do address translation based on PCB being run
        public inBounds(addr): boolean {
            var partition = _ProcessManager.running.Partition;
            if(addr + _MemoryManager.partitions[partition].base < _MemoryManager.partitions[partition].base + _MemoryManager.partitions[partition].limit && addr + _MemoryManager.partitions[partition].base >= _MemoryManager.partitions[partition].base){
                return true;
            }
            else{
                return false;
            }
        }

        // Loops address and enforces base/limit constraints
        public bneLoop(pc, branch): number {
            return (pc + branch + 2)%_MemoryManager.getLimitRegister(_ProcessManager.running.Partition);
        }
    }
}
