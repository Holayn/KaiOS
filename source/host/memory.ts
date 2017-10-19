///<reference path="../globals.ts" />

/* ------------
     memory.ts

     Requires global.ts.

     Routines for the host memory simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     ------------ */

module TSOS {

    export class Memory {

        // Let's just represent the memory as an array of size 768 bytes, 3 partitions of 256
        constructor(public memoryArray: Array<String>) {}

        // Initialize the memory and the memory display
        public init(): void {
            this.memoryArray = new Array<String>(768);
            // Initialize memory with all 00s
            for(var i=0; i<this.memoryArray.length; i++){
                this.memoryArray[i] = "00";
            }
            var table = (<HTMLTableElement>document.getElementById('tableMemory'));
            // We assume each row will hold 8 memory values
            for(var i=0; i<this.memoryArray.length/8; i++){
                var row = table.insertRow(i);
                var memoryAddrCell = row.insertCell(0);
                var address = i*8;
                // Display address in proper memory hex notation
                // Adds leading 0s if necessary
                var displayAddress = "0x";
                for(var k=0; k<3-address.toString(16).length; k++){
                    displayAddress += "0";
                }
                displayAddress += address.toString(16).toUpperCase();
                memoryAddrCell.innerHTML = displayAddress;
                // Fill all the cells with 00s
                for(var j=1; j<9; j++){
                    var cell = row.insertCell(j);
                    cell.innerHTML = "00";
                    cell.classList.add("memoryCell");
                }
            }
        }
    }
}
