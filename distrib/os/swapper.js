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
            // We need to allocate enough blocks to hold a largest program
            // Imagine a scenario where the disk is full. A process taking 2 blocks of memory is rolled into memory, and a process that would take
            // 4 blocks of memory is rolled out. Where would we put it? We're screwed! So we need to always allocate enough blocks to hold the largest program possible
            // To achieve this, we cheat by just extending the opcodes to have 256 bytes in total
            var length = opcodes.length;
            while (length < _MemoryManager.globalLimit) {
                opcodes.push("00");
                length++;
            }
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
            console.log("Performing roll in");
            var tsb = pcb.TSB;
            // Get the program stored in disk
            var data = _krnDiskDriver.krnDiskReadData(tsb);
            // Trim off extra data since we now allocate 5 blocks (300 bytes) for a program, which is more than what a memory partition can hold
            var extraData = Math.ceil(_MemoryManager.globalLimit / _Disk.dataSize) * _Disk.dataSize;
            for (var i = 0; i < extraData - _MemoryManager.globalLimit; i++) {
                data.pop();
            }
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
                // Update memory display 
                TSOS.Control.hostMemory();
            }
            else {
                // If there is no room, then we must roll out a process from memory into the disk, then put the new process in that place in memory
                this.rollOut(pcb);
            }
        };
        /**
         * Helper method to look through the process manager's queues for a PCB that is using a partition in memory
         * @param partition the partition being searched for
         */
        Swapper.prototype.lookInQueues = function (partition) {
            // Look in ready queue
            for (var i = 0; i < _ProcessManager.readyQueue.q.length; i++) {
                if (_ProcessManager.readyQueue.q[i].Partition == partition) {
                    return _ProcessManager.readyQueue.q[i];
                }
            }
            // Look in resident queue
            for (var i = 0; i < _ProcessManager.residentQueue.q.length; i++) {
                if (_ProcessManager.residentQueue.q[i].Partition == partition) {
                    return _ProcessManager.residentQueue.q[i];
                }
            }
        };
        /**
         * Performs a roll-out of a process from main memory to disk given a tsb to be moved to
         * @param pcb the process control block of program in disk
         */
        Swapper.prototype.rollOut = function (pcb) {
            var tsb = pcb.TSB;
            console.log("Performing roll out");
            // Get partition from memory...what partition? Let's do a random partition...RNG BOYZ
            var unluckyPartition = Math.floor(Math.random() * _MemoryManager.partitions.length);
            console.log("UNLUCKY PARTITION #: " + unluckyPartition + ". YOU LOSE TO RNG BUDDY LOL.");
            // Look for the PCB with that partition, we need to tell it the bad news (that it's going to disk aka jail)
            var unluckyPCB = this.lookInQueues(unluckyPartition);
            if (unluckyPCB != null) {
                // Get data from memory
                var memoryData = _MemoryManager.getMemoryPartitionData(unluckyPartition);
                // Free the partition
                _MemoryManager.clearMemoryPartition(unluckyPartition);
                // Get data from disk
                var data = _krnDiskDriver.krnDiskReadData(tsb);
                // Trim off extra bytes
                var extraData = Math.ceil(_MemoryManager.globalLimit / _Disk.dataSize) * _Disk.dataSize;
                for (var i = 0; i < extraData - _MemoryManager.globalLimit; i++) {
                    data.pop();
                }
                // Put data from disk into the partition from memory
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
                    return;
                }
                // Put the data from memory into disk and get the TSB of where it was written
                var memoryToDiskTSB = this.putProcessToDisk(memoryData);
                if (memoryToDiskTSB != null) {
                    // Success!
                    // Update the PCB to show that it is in disk
                    unluckyPCB.Partition = IN_DISK;
                    unluckyPCB.Swapped = true;
                    unluckyPCB.TSB = memoryToDiskTSB;
                    TSOS.Control.hostLog("Performed roll out and roll in", "os");
                    return;
                }
                else {
                    // Somehow, no more memory in disk even though we just cleared room for it. Something borked it up.
                    TSOS.Control.hostLog("Not enough space for rollout", "os");
                    _KernelInterruptQueue.enqueue(66); // cause a bsod because how else to freak everyone out?
                }
            }
        };
        return Swapper;
    }());
    TSOS.Swapper = Swapper;
})(TSOS || (TSOS = {}));
