///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />

/* ----------------------------------
   DeviceDriverKeyboard.ts

   Requires deviceDriver.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */

   module TSOS {
    
        // Extends DeviceDriver
        export class DeviceDriverDisk extends DeviceDriver {
    
            constructor() {
                // Override the base method pointers.
    
                // The code below cannot run because "this" can only be
                // accessed after calling super.
                super();
                this.driverEntry = this.krnDiskDriverEntry;
            }
    
            public krnDiskDriverEntry() {
                // Initialization routine for this, the kernel-mode Disk Device Driver.
                this.status = "loaded";
                // More?
            }

            // Performs a create given a file name
            public krnDiskCreate() {

            }

            // Performs a write given a file name
            public krnDiskWrite() {

            }

            // Performs a read given a file name
            public krnDiskRead() {
                
            }

            // Performs a delete given a file name
            public krnDiskDelete() {

            }

            // Performs a format on the disk by initializing all blocks in all sectors in all tracks on disk
            public krnFormat() {
                // For all values in session storage, set available bit to 0, pointer to 0,0,0, and fill data with 00s
                let zeroes = new Array<String>();
                for(var l=0; l<60; l++){
                    zeroes.push("00");
                }
                for(var i=0; i<_Disk.numOfTracks*_Disk.numOfSectors*_Disk.numOfBytes; i++){
                    // Get the JSON from the stored string
                    let block = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    block.availableBit = "0";
                    block.pointer = ["0","0","0"];
                    block.data = zeroes;
                }
                return true;
            }
        }
    }
    