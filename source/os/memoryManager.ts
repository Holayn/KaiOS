/* ------------
   memoryManager.ts

   This is the client OS implementation of a PCB
   ------------ */

   module TSOS {
    export class MemoryManager {
        public limit: number = 256;
        constructor(public base: Array<number>){
            this.base = [0,256,512];
        }
        
        // For now, we load programs into location 00 of memory, in the first partition.
        // Later, we'll have to change this
        public loadIntoMemory(opCodes): void {
            var loadCounter = this.base[0];
            for(var opCode of opCodes){
                _Memory.memoryArray[loadCounter] = opCode;
                loadCounter++;
            }
            // Fill rest of the partitions with 0's
            for(var i=loadCounter; i<this.limit; i++){
                _Memory.memoryArray[i] = "00";
            }
            console.log(_Memory.memoryArray);
            // Update the display accordingly
            // _Memory.clearMemory();
            _Memory.updateMemory();
        }

        // Checks to see if there is an available partition in memory
        // For now, we'll only check the first partition to see if it's available
        // public checkMemory(): boolean{
            // Check the first partition
            // for(var i=0; i<)
        // }
    }
}
