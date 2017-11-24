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

            // Performs a format on the disk
            public krnFormat() {

            }
    
        }
    }
    