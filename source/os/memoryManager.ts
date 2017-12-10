/* ------------
   memoryManager.ts

   This is the client OS implementation of a MMU.
   ------------ */

   module TSOS {
    export class MemoryManager {
        public partitions: Array<any>
        constructor(){
            // We'll have three partitions in memory, each of 256 bytes in size
            // We'll also store a flag for each partition representing if the partition is available
            this.partitions = [
                {"base": 0, "limit": 256, "isEmpty": true},
                {"base": 256, "limit": 256, "isEmpty": true},
                {"base": 512, "limit": 256, "isEmpty": true}
            ];
        }
        
        // For now, we load programs into location 00 of memory, in the first partition.
        public loadIntoMemory(opCodes, partition): void {
            var loadCounter = this.partitions[partition].base;
            for(var opCode of opCodes){
                _Memory.memoryArray[loadCounter] = opCode;
                loadCounter++;
            }
            // Fill rest of the partitions with 0's
            for(var i=loadCounter; i<this.partitions[partition].limit; i++){
                _Memory.memoryArray[i] = "00";
            }
            // Set the partition isEmpty flag to true so that we know the partition is unavailable
            this.partitions[partition].isEmpty = false;
            // Update the display accordingly
            Control.hostMemory();
        }

        // Checks to see if there is an available partition in memory
        public checkMemory(opcodesLength): boolean {
            for(var i=0; i<this.partitions.length; i++){
                if(this.partitions[i].isEmpty && this.partitions[i].limit >= opcodesLength){
                    return true;
                }
            }
            return false;
            // for(var i=this.partitions[0].base; i<this.partitions[0].limit; i++){
            //     if(_Memory.memoryArray[i] != "00"){
            //         this.partitions[0].isEmpty = false;
            //         return false;
            //     }
            // }
            // return true;
        }

        // Returns a reference to an available partition in memory 
        public getFreePartition(opcodesLength): number {
            for(var i=0; i<this.partitions.length; i++){
                if(this.partitions[i].isEmpty && this.partitions[i].limit >= opcodesLength){
                    return i;
                }
            }
            return -1;
        }

        // Clears a memory partition, given the partition, and marks the partition as available.
        // Make sure to update the memory display
        public clearMemoryPartition(partition): void {
            if(!this.canClearMemory(partition))
            console.log("Clearing memory partition " + partition);
            var base = this.partitions[partition].base;
            var limit = this.partitions[partition].limit + this.partitions[partition].base;
            for(var i=base; i<limit; i++){
                _Memory.memoryArray[i] = "00";
            }
            this.partitions[partition].isEmpty = true;
            Control.hostMemory();
        }

        // Clears all memory partitions
        public clearAllMemory(): boolean {
            if(_ProcessManager.readyQueue.length > 0){
                return false;
            }
            if(_ProcessManager.running != null){
                return false;
            }
            for(var j=0; j<this.partitions.length; j++){
                var base = this.partitions[j].base;
                var limit = this.partitions[j].limit + this.partitions[j].base;
                for(var i=base; i<limit; i++){
                    _Memory.memoryArray[i] = "00";
                }
                this.partitions[j].isEmpty = true;
            }
            Control.hostMemory();
            return true;
        }

        // This performs a check to prevent user from clearing memory
        // when the memory is being used in a program, by making sure the partition
        // being cleared doesn't belong to a process
        public canClearMemory(partition): boolean {
            if(_ProcessManager.readyQueue.length > 0) {
                for(var i=0; i<_ProcessManager.readyQueue.q.length; i++){
                    if(_ProcessManager.readyQueue.q[i].partition == partition){
                        return false;
                    }
                }
            }
            if(_ProcessManager.running != null) {
                if(_ProcessManager.running.partition == partition){
                    return false;
                }
            }
            return true;
        }

        // These return the base and limit registers based on the partition number given
        public getBaseRegister(partition): number {
            return this.partitions[partition].base;
        }
        public getLimitRegister(partition): number {
            return this.partitions[partition].limit;
        }

        // Gets the current partition the CPU is executing in by checking what
        // partition the running process is in via process manager
        public getCurrentPartition(): number {
            return _ProcessManager.running.Partition;
        }
    }
}
