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
        // Later, we'll have to change this when we deal with the other partitions
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
            Control.hostMemory();
        }

        // Checks to see if there is an available partition in memory
        // For now, we'll only check the first partition to see if it's available
        // If there is, we should keep track what the base register is
        // This really should be the scheduler's job, but not implementing
        // that yet.
        public checkMemory(): boolean {
            for(var i=this.base[0]; i<this.limit; i++){
                if(_Memory.memoryArray[i] != "00"){
                    return false;
                }
            }
            return true;
        }

        // Clears a memory partition, given the partition.
        // Clears the memory in the range of addresses provided by the PCB's base and limit
        public clearMemoryPartition(pcb): void {
            console.log("Clearing memory partition");
            for(var i=pcb.Base; i<pcb.Limit; i++){
                _Memory.memoryArray[i] = "00";
            }
        }
        // The only base register we care about for now is the one
        // for the first partition.
        public getBaseRegister(): number {
            return 0;
        }
        public getLimitRegister(): number{
            return this.limit;
        }
    }
}
