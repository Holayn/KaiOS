/* ------------
   swapper.ts

   This is the client OS implementation of a swapper.
   This is responsible for performing process swapping operations to and from disk.
   ------------ */

   module TSOS {
    export class Swapper {
        constructor(){}

        /**
         * Calls the disk device driver to find enough space to store the program
         * Returns the filename of the swapfile
         * @param opcodes the hex array of opcodes
         */
        public putProcessToDisk(opcodes, pid): String {
            // Create file name for process... make it $SWAPPID
            let filename = "$SWAP" + pid;
            console.log("creating new swap file " + filename);
            _krnDiskDriver.krnDiskCreate(filename);
            let length = opcodes.length;
            while(length < _MemoryManager.globalLimit){
                opcodes.push("00");
                length++;
            }
            console.log(length);
            _krnDiskDriver.krnDiskWriteSwap(filename, opcodes);
            return filename;
            // // Create a swap file and get the TSB to where the data will start in disk
            // let datBlockTSB = _krnDiskDriver.krnDiskCreateSwapFile(filename);
            // // console.log("DATBLOCKTSBSWAP" + datBlockTSB);
            // if(datBlockTSB != FULL_DISK_SPACE){
            //     // Now write to disk.
            //     // We need to allocate enough blocks to hold a largest program
            //     // Imagine a scenario where the disk is full. A process taking 2 blocks of memory is rolled into memory, and a process that would take
            //     // 4 blocks of memory is rolled out. Where would we put it? We're screwed! So we need to always allocate enough blocks to hold the largest program possible
            //     // To achieve this, we cheat by just extending the opcodes to have 256 bytes in total
            //     let length = opcodes.length;
            //     while(length < _MemoryManager.globalLimit){
            //         opcodes.push("00");
            //         length++;
            //     }
            //     console.log(length);
            //     let enoughFreeSpace = _krnDiskDriver.allocateDiskSpace(opcodes, datBlockTSB);
            //     if(!enoughFreeSpace){
            //         return null;
            //     }
            //     else{
            //         // Write the opcodes to disk
            //         _krnDiskDriver.writeDiskData(datBlockTSB, opcodes);
            //         return datBlockTSB;
            //     }
            // }
            // else{
            //     return null;
            // }
        }

        /**
         * Performs a roll-in of a process from disk to main memory
         * @param pcb the PCB of the process in disk
         */
        public rollIn(pcb) {
            console.log("Performing roll in");
            // Find swap file in directory structure
            let filename = "$SWAP" + pcb.Pid;
            // let tsb = pcb.TSB;
            // Get the TSB of the program stored in disk
            let data = _krnDiskDriver.krnDiskRead(filename).data;
            // let tsb = _krnDiskDriver.krnFindSwapFile(filename);
            // let data = _krnDiskDriver.krnDiskReadData(tsb);
            // Trim off extra data since we now allocate 5 blocks (300 bytes) for a program, which is more than what a memory partition can hold
            let extraData = Math.ceil(_MemoryManager.globalLimit / _Disk.dataSize) * _Disk.dataSize;
            for(var i=0; i<extraData-_MemoryManager.globalLimit; i++){
                data.pop();
            }
            // Look for a space in main memory to put the process from disk
            if(_MemoryManager.checkMemory(data.length)){
                var partition = _MemoryManager.getFreePartition(data.length);
                _MemoryManager.loadIntoMemory(data, partition);
                // Update the PCB's partition to the one it got placed in
                pcb.Partition = partition;
                // Remove the program from disk
                _krnDiskDriver.krnDiskDelete(filename);
                // _krnDiskDriver.krnDiskDeleteProcess(tsb);
                // Update disk display
                Control.hostDisk();
                // Update memory display 
                Control.hostMemory();
            }
            else{
                // If there is no room, then we must roll out a process from memory into the disk, then put the new process in that place in memory
                this.rollOut(pcb);
            }
        }

        /**
         * Helper method to look through the process manager's queues for a PCB that is using a partition in memory
         * @param partition the partition being searched for
         */
        private lookInQueues(partition) {
            // Look in ready queue
            for(var i=0; i<_ProcessManager.readyQueue.q.length; i++){
                if(_ProcessManager.readyQueue.q[i].Partition == partition){
                    return _ProcessManager.readyQueue.q[i];
                }
            }
            // Look in resident queue
            for(var i=0; i<_ProcessManager.residentQueue.q.length; i++){
                if(_ProcessManager.residentQueue.q[i].Partition == partition){
                    return _ProcessManager.residentQueue.q[i];
                }
            }
        }

        /**
         * Performs a roll-out of a process from main memory to disk given a tsb to be moved to
         * @param pcb the process control block of program in disk
         */
        public rollOut(pcb) {
            // Find swap file in directory structure
            let filename = "$SWAP" + pcb.Pid;
            // let tsb = pcb.TSB;
            // Get the TSB of the program stored in disk
            // let tsb = _krnDiskDriver.krnFindSwapFile(filename);
            console.log("Performing roll out");
            // Get partition from memory...what partition? Let's do a random partition...RNG BOYZ Randomization is also efficient
            let unluckyPartition = Math.floor(Math.random() * _MemoryManager.partitions.length); 
            console.log("UNLUCKY PARTITION #: " + unluckyPartition + ". YOU LOSE TO RNG BUDDY LOL.");
            // Look for the PCB with that partition, we need to tell it the bad news (that it's going to disk aka jail)
            let unluckyPCB = this.lookInQueues(unluckyPartition);
            if(unluckyPCB != null){
                // Get data from memory
                let memoryData = _MemoryManager.getMemoryPartitionData(unluckyPartition);
                // Free the partition
                _MemoryManager.clearMemoryPartition(unluckyPartition);
                // Get data from disk
                let data = _krnDiskDriver.krnDiskRead(filename).data;
                // let data = _krnDiskDriver.krnDiskReadData(tsb);
                // Trim off extra bytes
                let extraData = Math.ceil(_MemoryManager.globalLimit / _Disk.dataSize) * _Disk.dataSize;
                for(var i=0; i<extraData-_MemoryManager.globalLimit; i++){
                    data.pop();
                }
                // Put data from disk into the partition from memory
                if(_MemoryManager.checkMemory(data.length)){
                    var partition = _MemoryManager.getFreePartition(data.length);
                    _MemoryManager.loadIntoMemory(data, partition);
                    // Update the PCB's partition to the one it got placed in
                    pcb.Partition = partition;
                    pcb.Swapped = false;
                    pcb.State = "Ready";
                    // Remove the program from disk by deleting the swap file
                    console.log("deleting old swap file" + filename);
                    _krnDiskDriver.krnDiskDelete(filename);
                    // _krnDiskDriver.krnDiskDeleteProcess(tsb);
                    // Update disk display
                    Control.hostDisk();
                }
                else{
                    return;
                }
                // Put the data from memory into disk and get the TSB of where it was written
                console.log("putting new swap file to disk");
                console.log(memoryData.length);
                let memoryToDiskTSB = this.putProcessToDisk(memoryData, unluckyPCB.Pid);
                if(memoryToDiskTSB != null){
                    console.log("put new swap file in disk");
                    // Success!
                    // Update the PCB to show that it is in disk
                    unluckyPCB.Partition = IN_DISK;
                    unluckyPCB.Swapped = true;
                    unluckyPCB.State = "Swapped";
                    unluckyPCB.TSB = memoryToDiskTSB;
                    Control.hostLog("Performed roll out and roll in", "os");
                    // update processes display
                    Control.hostProcesses();
                    return;
                }
                else{
                    // Somehow, no more memory in disk even though we just cleared room for it. Something borked it up.
                    Control.hostLog("Not enough space for rollout", "os");
                    // Stop the CPU from executing, clear memory, and print out a hurtful message.
                    _MemoryManager.clearAllMemory();
                    _CPU.isExecuting = false;
                    _StdOut.putText("Not enough space on disk for rollout. Please reformat your disk.");
                    // _KernelInterruptQueue.enqueue(66); // cause a bsod because how else to freak everyone out?
                }
            }
        }
    }
}
