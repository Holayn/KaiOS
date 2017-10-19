/* ------------
   memoryManager.ts

   This is the client OS implementation of a MMU.
   ------------ */

   module TSOS {
    export class MemoryManager {
        constructor(public partitions: Array<Object>){
            // We'll have three partitions in memory, each of 256 bytes in size
            // We'll also store a flag for each partition representing if the partition is available
            this.partitions = [
                {"base": 0, "limit": 256, "isEmpty": true},
                {"base": 256, "limit": 256, "isEmpty": true},
                {"base": 512, "limit": 256, "isEmpty": true}
            ];
        }
        
        // For now, we load programs into location 00 of memory, in the first partition.
        // Later, we'll have to change this when we deal with the other partitions
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
            // _Memory.clearMemory();
            Control.hostMemory();
        }

        // Checks to see if there is an available partition in memory
        // For now, we'll only check the first partition to see if it's available (Project 2)
        public checkMemory(opcodesLength): boolean {
            if(this.partitions[0].isEmpty && this.partitions[0].limit >= opcodesLength){
                return true;
            }
            else{
                return false;
            }
            // for(var i=this.partitions[0].base; i<this.partitions[0].limit; i++){
            //     if(_Memory.memoryArray[i] != "00"){
            //         this.partitions[0].isEmpty = false;
            //         return false;
            //     }
            // }
            // return true;
        }

        // Returns a reference to an available partition in memory 
        // For now, only checks to see if the first partition is available (Project 2)
        // If it is, return a reference to it
        public getFreePartition(opcodesLength): number {
            if(this.partitions[0].isEmpty && this.partitions[0].limit >= opcodesLength){
                return 0;
            }
            else{
                return -1;
            }
        }

        // Clears a memory partition, given the partition, and marks the partition as available.
        // Make sure to update the memory display
        public clearMemoryPartition(partition): void {
            console.log("Clearing memory partition " + partition);
            for(var i=this.partitions[partition].base; i<this.partitions[partition].limit; i++){
                _Memory.memoryArray[i] = "00";
            }
            this.partitions[partition].isEmpty = true;
            Control.hostMemory();
        }

        // These return the base and limit registers based on the partition number given
        public getBaseRegister(partition): number {
            return this.partitions[partition].base;
        }
        public getLimitRegister(partition): number {
            return this.partitions[partition].limit;
        }

        // Gets the current partition the CPU is executing in by checking where
        // in memory the program counter is currently executing
        public getCurrentPartition(pc): number {
            for(var i=0; i<this.partitions.length; i++){
                var base = this.partitions[i].base;
                var limit = this.partitions[i].limit;
                if(pc > base && pc < base + limit){
                    return i;
                }
            }
        }

        // This reads the memory based on a given address in memory
        // Returns the hex string value stored in memory
        public readMemory(addr): string {
            return _Memory.memoryArray[addr].toString();
        }

        // This writes to memory based on an address and value given
        public writeMemory(addr, value): void {
            if(parseInt(value, 16) < 16){
                value = "0" + value;
            }
            _Memory.memoryArray[addr] = value;
        }

    }
}
