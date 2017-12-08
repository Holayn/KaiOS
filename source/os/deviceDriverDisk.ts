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

            public numOfTracks: number = 4; // The number of tracks on the disk
            public numOfSectors: number = 8; // The number of sectors in each track
            public numOfBlocks: number = 8; // The number of blocks in each sector
            public dataSize: number = 60; // The actual amount of bytes we can write data to.
    
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

            private checkForExistingFile(filename: String): boolean {
                let hexArr = this.stringToASCII(filename);
                for(var i=1; i<this.numOfSectors*this.numOfBlocks; i++){
                    let dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    let matchingFileName = true;
                    // Don't look in blocks not in use
                    if(dirBlock.availableBit == "1"){
                        for(var j=0; j<hexArr.length; j++){
                            if(hexArr[j] != dirBlock.data[j]){
                                matchingFileName = false
                            }
                        }
                        // We found the filename
                        if(matchingFileName){
                            return true;
                        }
                    }
                }
                return false;
            }

            // Performs a create given a file name
            public krnDiskCreate(filename: String) {
                // Check for existing filename
                if(this.checkForExistingFile(filename)){
                    return FILE_NAME_ALREADY_EXISTS;
                }
                // Look for first free block in directory data structure (first track)
                // Leave out the first block, which is the MBR
                for(var i=1; i<this.numOfSectors*this.numOfBlocks; i++){
                    let dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    // If the block is available, set the passed filename in the data
                    if(dirBlock.availableBit == "0"){
                        // Now look for first free block in data structure so we actually have a "place" to put the file
                        for(var j=(this.numOfSectors*this.numOfBlocks); j<(this.numOfTracks*this.numOfSectors*this.numOfBlocks); j++){
                            let datBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(j)));
                            // If the block is available, mark it as unavailable, and set its tsb to the dirBlock pointer
                            if(datBlock.availableBit == "0"){
                                dirBlock.availableBit = "1";
                                datBlock.availableBit = "1";
                                dirBlock.pointer = sessionStorage.key(j); // set pointer to space in memory
                                // Convert filename to ASCII/hex and store in data
                                let hexArr = this.stringToASCII(filename);
                                // We only replace the bytes needed, not the entire data array
                                for(var k=0; k<hexArr.length; k++){
                                    dirBlock.data[k] = hexArr[k];
                                }
                                sessionStorage.setItem(sessionStorage.key(i), JSON.stringify(dirBlock));
                                sessionStorage.setItem(sessionStorage.key(j), JSON.stringify(datBlock));
                                // Update the disk display and return success
                                Control.hostDisk();
                                return FILE_SUCCESS;
                            }
                        }
                        return FULL_DISK_SPACE; // We ran through the data structure but there were no free blocks, meaning no more space on disk :(((((((
                    }
                }
                return FULL_DISK_SPACE; // We ran through the directory data structure but there were no free blocks, meaning no more space on disk :(
            }

            // Performs a write given a file name
            public krnDiskWrite(filename: String, text: String) {
                // Look for filename
                let hexArr = this.stringToASCII(filename);
                for(var i=1; i<this.numOfSectors*this.numOfBlocks; i++){
                    let dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    let matchingFileName = true;
                    // Don't look in blocks not in use
                    if(dirBlock.availableBit == "1"){
                        for(var j=0; j<hexArr.length; j++){
                            if(hexArr[j] != dirBlock.data[j]){
                                matchingFileName = false
                            }
                        }
                        // We found the filename
                        if(matchingFileName){
                            // Convert the text to a hex array
                            let textHexArr = this.stringToASCII(text);
                            // Check size of text. If it is longer than 60, then we need to allocate another datablock
                            if(textHexArr.length > this.dataSize){
                            // Get the first datablock, recursively write string.
                                let dataBlock = JSON.parse(sessionStorage.getItem(dirBlock.pointer));
                            }
                        }
                    }
                }
                return FILE_NAME_NO_EXIST;
            }

            // Performs a read given a file name
            public krnDiskRead() {
                
            }

            // Performs a delete given a file name
            public krnDiskDelete() {

            }

            // Performs a format on the disk by initializing all blocks in all sectors in all tracks on disk
            public krnFormat() {
                // Clear session storage
                sessionStorage.clear();
                // Init the storage
                for(var i=0; i<this.numOfTracks; i++){
                    for(var j=0; j<this.numOfSectors; j++){
                        for(var k=0; k<this.numOfBlocks; k++){
                            let key = i + ":" + j + ":" + k;
                            let zeroes = new Array<String>();
                            for(var l=0; l<this.dataSize; l++){
                                zeroes.push("00");
                            }
                            let block = {
                                availableBit : "0", // Flags a block as available or not
                                pointer: ["0:0:0"], // Pointer to next data block
                                data: zeroes // Rest of 64 bytes is filled with data
                            }
                            sessionStorage.setItem(key, JSON.stringify(block));
                        }
                    }
                }
                // // For all values in session storage, set available bit to 0, pointer to 0,0,0, and fill data with 00s
                // let zeroes = new Array<String>();
                // for(var l=0; l<60; l++){
                //     zeroes.push("00");
                // }
                // for(var i=0; i<_Disk.numOfTracks*_Disk.numOfSectors*_Disk.numOfBlocks; i++){
                //     // Get the JSON from the stored string
                //     let block = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                //     block.availableBit = "0";
                //     block.pointer = "0:0:0";
                //     block.data = zeroes;
                // }
                // Update disk display
                Control.hostDisk();
                // TODO: Return false if a format can't be performed at that time
                return true;
            }

            // Helper method to convert string to ASCII to hex
            // Returns an array of each character represented as hex
            private stringToASCII(string: String){
                let hexArr = [];
                // Look at each character's ASCII value and convert it to a hex string
                for(var i=0; i<string.length; i++){
                    let hexChar = string.charCodeAt(i).toString(16);
                    hexArr.push(hexChar);
                }
                return hexArr;
            }
        }
    }
    