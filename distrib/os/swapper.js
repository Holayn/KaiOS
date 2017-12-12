/* ------------
   swapper.ts

   This is the client OS implementation of a swapper.
   This is responsible for keeping track of all the processes in the OS,
   as well as creating, saving, and exiting them.
   PROJECT 2: NOT UPDATING PCB BECAUSE WE NEVER DO A CONTEXT SWITCH.
   ------------ */
var TSOS;
(function (TSOS) {
    var Swapper = /** @class */ (function () {
        function Swapper() {
        }
        /**
         * Calls the disk device driver to find enough space to store the program
         * Returns the first TSB of the newly allocated data block
         * @param opcodes the hex array of opcodes
         */
        Swapper.prototype.putProcessToDisk = function (opcodes) {
            // First, find a free data block to hold the opcodes
            var tsb = _krnDiskDriver.findFreeDataBlock();
            // Now, call the device driver's allocate disk space to see if need more data blocks to hold the opcodes
            // This will allocate those blocks as being used and update pointers
            var enoughFreeSpace = _krnDiskDriver.allocateDiskSpace(opcodes, tsb);
            if (!enoughFreeSpace) {
                return null;
            }
            else {
                // Write the opcodes to disk
                _krnDiskDriver.writeDiskData(tsb, opcodes);
                return tsb;
            }
        };
        /**
         * Performs a roll-in of a process from disk to main memory given its TSB
         * @param pcb the PCB of the process in disk
         */
        Swapper.prototype.rollIn = function (pcb) {
            var tsb = pcb.TSB;
            // Get the program stored in disk
            var data = _krnDiskDriver.krnDiskReadData(tsb);
            // Look for a space in main memory to put the process from disk
            if (_MemoryManager.checkMemory(data.length)) {
                var partition = _MemoryManager.getFreePartition(data.length);
                _MemoryManager.loadIntoMemory(data, partition);
                // Update the PCB's partition to the one it got placed in
                pcb.Partition = partition;
                // Remove the program from disk
                _krnDiskDriver.krnDiskDeleteData(tsb);
                // Update disk display
                TSOS.Control.hostDisk();
            }
            else {
                // If there is no room, then we must roll out a process from memory into the disk, then put the new process in that place in memory
                this.rollOut(tsb);
            }
        };
        /**
         * Performs a roll-out of a process from main memory to disk given a tsb to be moved to
         * @param tsb the data block for the process to be moved to
         */
        Swapper.prototype.rollOut = function (tsb) {
            // Get partition from memory...what partition? Let's do a random partition...RNG BOYZ
            var unluckyParition = Math.floor(Math.random() * _MemoryManager.partitions.length);
            // Get data from memory
            var memoryData = _MemoryManager.getMemoryPartitionData(unluckyParition);
            // Free the partition
            _MemoryManager.clearMemoryPartition(unluckyParition);
            // Get data from disk
            var data = _krnDiskDriver.krnDiskReadData(tsb);
            // Put data from disk into the partition from memory
            if (_MemoryManager.checkMemory(data.length)) {
                var partition = _MemoryManager.getFreePartition(data.length);
                _MemoryManager.loadIntoMemory(data, partition);
                // Remove the program from disk
                _krnDiskDriver.krnDiskDeleteData(tsb);
                // Update disk display
                TSOS.Control.hostDisk();
            }
            else {
                return;
            }
            // Put the data from memory into disk and get the TSB of where it was written
            var memoryToDiskTSB = this.putProcessToDisk(memoryData);
            if (memoryToDiskTSB != null) {
            }
            else {
                // Somehow, no more memory in disk even though we just cleared room for it. Something borked it up.
                TSOS.Control.hostLog("Not enough space for rollout", "os");
                _KernelInterruptQueue.enqueue(66); // cause a bsod because how else to freak everyone out?
            }
        };
        return Swapper;
    }());
    TSOS.Swapper = Swapper;
})(TSOS || (TSOS = {}));
