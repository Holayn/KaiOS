/* ------------
   swapper.ts

   This is the client OS implementation of a swapper.
   This is responsible for performing process swapping operations to and from disk.
   ------------ */
var TSOS;
(function (TSOS) {
    var Swapper = /** @class */ (function () {
        function Swapper() {
        }
        /**
         * Calls the disk device driver to find enough space to store the program
         * Returns the filename of the swapfile
         * @param opcodes the hex array of opcodes
         */
        Swapper.prototype.putProcessToDisk = function (opcodes, pid) {
            // Create file name for process... make it $SWAPPID
            var filename = "$SWAP" + pid;
            _krnDiskDriver.krnDiskCreate(filename);
            var length = opcodes.length;
            while (length < _MemoryManager.globalLimit) {
                opcodes.push("00");
                length++;
            }
            _krnDiskDriver.krnDiskWriteSwap(filename, opcodes);
            return filename;
        };
        /**
         * Performs a roll-in of a process from disk to main memory
         * @param pcb the PCB of the process in disk
         */
        Swapper.prototype.rollIn = function (pcb) {
            // Find swap file in directory structure
            var filename = "$SWAP" + pcb.Pid;
            // Get the TSB of the program stored in disk
            var data = _krnDiskDriver.krnDiskRead(filename).data;
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
                _krnDiskDriver.krnDiskDelete(filename);
                // _krnDiskDriver.krnDiskDeleteProcess(tsb);
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
            // Find swap file in directory structure
            var filename = "$SWAP" + pcb.Pid;
            // Get the TSB of the program stored in disk
            // Get partition from memory...what partition? Let's do a random partition...RNG BOYZ Randomization is also efficient
            var unluckyPartition = Math.floor(Math.random() * _MemoryManager.partitions.length);
            // Look for the PCB with that partition, we need to tell it the bad news (that it's going to disk aka jail)
            var unluckyPCB = this.lookInQueues(unluckyPartition);
            if (unluckyPCB != null) {
                // Get data from memory
                var memoryData = _MemoryManager.getMemoryPartitionData(unluckyPartition);
                // Free the partition
                _MemoryManager.clearMemoryPartition(unluckyPartition);
                // Get data from disk
                var data = _krnDiskDriver.krnDiskRead(filename).data;
                // let data = _krnDiskDriver.krnDiskReadData(tsb);
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
                    pcb.Swapped = false;
                    pcb.State = "Ready";
                    // Remove the program from disk by deleting the swap file
                    _krnDiskDriver.krnDiskDelete(filename);
                    // _krnDiskDriver.krnDiskDeleteProcess(tsb);
                    // Update disk display
                    TSOS.Control.hostDisk();
                }
                else {
                    return;
                }
                // Put the data from memory into disk and get the TSB of where it was written
                var memoryToDiskTSB = this.putProcessToDisk(memoryData, unluckyPCB.Pid);
                if (memoryToDiskTSB != null) {
                    // Success!
                    // Update the PCB to show that it is in disk
                    unluckyPCB.Partition = IN_DISK;
                    unluckyPCB.Swapped = true;
                    unluckyPCB.State = "Swapped";
                    unluckyPCB.TSB = memoryToDiskTSB;
                    TSOS.Control.hostLog("Performed roll out and roll in", "os");
                    // update processes display
                    TSOS.Control.hostProcesses();
                    return;
                }
                else {
                    // Somehow, no more memory in disk even though we just cleared room for it. Something borked it up.
                    TSOS.Control.hostLog("Not enough space for rollout", "os");
                    // Stop the CPU from executing, clear memory, and print out a hurtful message.
                    _MemoryManager.clearAllMemory();
                    _CPU.isExecuting = false;
                    _StdOut.putText("Not enough space on disk for rollout. Please reformat your disk.");
                    // _KernelInterruptQueue.enqueue(66); // cause a bsod because how else to freak everyone out?
                }
            }
        };
        return Swapper;
    }());
    TSOS.Swapper = Swapper;
})(TSOS || (TSOS = {}));
