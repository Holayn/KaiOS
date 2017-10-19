/* ------------
   memoryManager.ts

   This is the client OS implementation of a MMU.
   ------------ */
var TSOS;
(function (TSOS) {
    var MemoryManager = /** @class */ (function () {
        function MemoryManager(partitions) {
            this.partitions = partitions;
            // We'll have three partitions in memory, each of 256 bytes in size
            // We'll also store a flag for each partition representing if the partition is available
            this.partitions = [
                { "base": 0, "limit": 256, "isEmpty": true },
                { "base": 256, "limit": 256, "isEmpty": true },
                { "base": 512, "limit": 256, "isEmpty": true }
            ];
        }
        // For now, we load programs into location 00 of memory, in the first partition.
        // Later, we'll have to change this when we deal with the other partitions
        MemoryManager.prototype.loadIntoMemory = function (opCodes, partition) {
            var loadCounter = this.partitions[partition].base;
            for (var _i = 0, opCodes_1 = opCodes; _i < opCodes_1.length; _i++) {
                var opCode = opCodes_1[_i];
                _Memory.memoryArray[loadCounter] = opCode;
                loadCounter++;
            }
            // Fill rest of the partitions with 0's
            for (var i = loadCounter; i < this.partitions[partition].limit; i++) {
                _Memory.memoryArray[i] = "00";
            }
            // Set the partition isEmpty flag to true so that we know the partition is unavailable
            this.partitions[partition].isEmpty = false;
            // Update the display accordingly
            // _Memory.clearMemory();
            TSOS.Control.hostMemory();
        };
        // Checks to see if there is an available partition in memory
        // For now, we'll only check the first partition to see if it's available (Project 2)
        MemoryManager.prototype.checkMemory = function (opcodesLength) {
            if (this.partitions[0].isEmpty && this.partitions[0].limit >= opcodesLength) {
                return true;
            }
            else {
                return false;
            }
            // for(var i=this.partitions[0].base; i<this.partitions[0].limit; i++){
            //     if(_Memory.memoryArray[i] != "00"){
            //         this.partitions[0].isEmpty = false;
            //         return false;
            //     }
            // }
            // return true;
        };
        // Returns a reference to an available partition in memory 
        // For now, only checks to see if the first partition is available (Project 2)
        // If it is, return a reference to it
        MemoryManager.prototype.getFreePartition = function (opcodesLength) {
            if (this.partitions[0].isEmpty && this.partitions[0].limit >= opcodesLength) {
                return 0;
            }
            else {
                return -1;
            }
        };
        // Clears a memory partition, given the partition, and marks the partition as available.
        // Make sure to update the memory display
        MemoryManager.prototype.clearMemoryPartition = function (partition) {
            console.log("Clearing memory partition " + partition);
            for (var i = this.partitions[partition].base; i < this.partitions[partition].limit; i++) {
                _Memory.memoryArray[i] = "00";
            }
            this.partitions[partition].isEmpty = true;
            TSOS.Control.hostMemory();
        };
        // These return the base and limit registers based on the partition number given
        MemoryManager.prototype.getBaseRegister = function (partition) {
            return this.partitions[partition].base;
        };
        MemoryManager.prototype.getLimitRegister = function (partition) {
            return this.partitions[partition].limit;
        };
        // Gets the current partition the CPU is executing in by checking what
        // partition the running process is in via process manager
        MemoryManager.prototype.getCurrentPartition = function (pc) {
            return _ProcessManager.running.Partition;
        };
        // This reads the memory based on a given address in memory
        // Returns the hex string value stored in memory
        // Enforce memory out of bounds rule
        MemoryManager.prototype.readMemory = function (addr) {
            if (this.inBounds(addr)) {
                return _Memory.memoryArray[addr].toString();
            }
            else {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PROCESS_EXIT, 0));
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CONSOLE_WRITE_IR, "Out of bounds memory access error..."));
            }
        };
        // This writes to memory based on an address and value given
        // Enforce memory out of bounds rule
        MemoryManager.prototype.writeMemory = function (addr, value) {
            if (this.inBounds(addr)) {
                if (parseInt(value, 16) < 16) {
                    value = "0" + value;
                }
                _Memory.memoryArray[addr] = value;
            }
            else {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PROCESS_EXIT, 0));
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CONSOLE_WRITE_IR, "Out of bounds memory access error..."));
            }
        };
        // Checks to make sure the memory being accessed is within the range specified by the base/limit
        MemoryManager.prototype.inBounds = function (addr) {
            var partition = _ProcessManager.running.Partition;
            if (addr >= this.partitions[partition].base && addr < this.partitions[partition].base + this.partitions[partition].limit) {
                return true;
            }
            else {
                return false;
            }
        };
        return MemoryManager;
    }());
    TSOS.MemoryManager = MemoryManager;
})(TSOS || (TSOS = {}));
