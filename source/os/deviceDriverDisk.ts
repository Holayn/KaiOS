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

            private checkForExistingFile(filename: String): boolean {
                let hexArr = this.stringToASCII(filename);
                for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
                    let dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    let matchingFileName = true;
                    // Don't look in blocks not in use
                    if(dirBlock.availableBit == "1"){
                        for(var j=0; j<hexArr.length; j++){
                            if(hexArr[j] != dirBlock.data[j]){
                                matchingFileName = false
                            }
                        }
                        // If reach end of hexArr but dirBlock data still more?
                        if(dirBlock.data[hexArr.length] != "00"){
                            matchingFileName = false;
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
                for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
                    let dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    // If the block is available...
                    if(dirBlock.availableBit == "0"){
                        // Now look for first free block in data structure so we actually have a "place" to put the file
                        let datBlockTSB = this.findFreeDataBlock();
                        if(datBlockTSB != null){
                            let datBlock = JSON.parse(sessionStorage.getItem(datBlockTSB));
                            dirBlock.availableBit = "1";
                            datBlock.availableBit = "1";
                            dirBlock.pointer = datBlockTSB; // set pointer to space in memory
                            // Convert filename to ASCII/hex and store in data
                            let hexArr = this.stringToASCII(filename);
                            // Clear the directory block's data first a.k.a the filename if it was there before
                            dirBlock = this.clearData(dirBlock);
                            // We only replace the bytes needed, not the entire data array
                            for(var k=0; k<hexArr.length; k++){
                                dirBlock.data[k] = hexArr[k];
                            }
                            sessionStorage.setItem(sessionStorage.key(i), JSON.stringify(dirBlock));
                            sessionStorage.setItem(datBlockTSB, JSON.stringify(datBlock));
                            // Update the disk display and return success
                            Control.hostDisk();
                            return FILE_SUCCESS;
                        }
                        return FULL_DISK_SPACE; // We ran through the data structure but there were no free blocks, meaning no more space on disk :(((((((
                    }
                }
                return FULL_DISK_SPACE; // We ran through the directory data structure but there were no free blocks, meaning no more space on disk :(
            }

            // Return the TSB of the next free data block. If can't find, return null.
            public findFreeDataBlock() {
                for(var j=(_Disk.numOfSectors*_Disk.numOfBlocks); j<(_Disk.numOfTracks*_Disk.numOfSectors*_Disk.numOfBlocks); j++){
                    let datBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(j)));
                    // If the block is available, mark it as unavailable, and set its tsb to the dirBlock pointer
                    if(datBlock.availableBit == "0"){
                        return sessionStorage.key(j);
                    }
                }
                return null;
            }

            /**
             * Returns the TSBs of free data blocks in some array.
             * If not enough free data blocks are found, then return null.
             * @param numBlocks the number of free blocks to find
             */
            private findFreeDataBlocks(numBlocks: number) {
                console.log(numBlocks);
                let blocks = []; // storage for the free blocks
                let startOfDiskIndex = _Disk.numOfSectors*_Disk.numOfBlocks; // This is where the data blocks start in the disk
                let endOfDiskIndex = _Disk.numOfTracks*_Disk.numOfSectors*_Disk.numOfBlocks; // This is where the disk ends
                for(var i=startOfDiskIndex; i<endOfDiskIndex; i++){
                    let datBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    // If the block is available, push it to the array of free blocks we can use
                    if(datBlock.availableBit == "0"){
                        blocks.push(sessionStorage.key(i));
                        numBlocks--;
                    }
                    // We found enough free blocks
                    if(numBlocks == 0){
                        return blocks;
                    }
                }
                if(numBlocks != 0){
                    return null;
                }
            }

            /**
             * Allocates space in the disk by finding enough data blocks to hold the file
             * Returns false if there are not enough free data blocks to do so
             * @param file the file represented as an array of hex digits
             * @param tsb the first TSB in the chain of data blocks
             * @param setBlocks optional parameter that can be passed in order to have a number of blocks set regardless
             */
            public allocateDiskSpace(file: Array<String>, tsb: string, setBlocks: number = 0): boolean {
                // Check size of text. If it is longer than 60, then we need to have enough datablocks
                console.log(file);
                let stringLength = file.length;
                let datBlockTSB = tsb; // pointer to current block we're looking at
                let datBlock = JSON.parse(sessionStorage.getItem(datBlockTSB)); 
                // Check to see if we have a set number of blocks to allocate. If not, proceed normally.
                if(setBlocks == 0){
                    // What if data block writing to already pointing to stuff? Then we need to traverse it, making sure there is enough space to hold our new file.
                    // Continuously allocate new blocks until we gucci
                    while(stringLength > _Disk.dataSize){
                        // If pointer 0:0:0, then we need to find free blocks
                        // Else if it is already pointing to something, we're good already
                        if(datBlock.pointer != "0:0:0"){
                            stringLength -= _Disk.dataSize;
                            // Update pointers
                            datBlockTSB = datBlock.pointer;
                            datBlock = JSON.parse(sessionStorage.getItem(datBlock.pointer));
                        }
                        else{
                            // We reached the end of the blocks that have already been allocated for this file. We need MOAR.
                            // Find enough free data blocks, if can't, return error
                            // First, find out how many more datablocks we need
                            let numBlocks = Math.ceil(stringLength / _Disk.dataSize);
                            // Go find that number of free blocks
                            let freeBlocks = this.findFreeDataBlocks(numBlocks); // array of tsbs that are free
                            if(freeBlocks != null){
                                // Once we get those n blocks, mark them as used, then set their pointers accordingly.
                                // Set the current block's pointer to the first block in the array, then recursively set pointers
                                for(var block of freeBlocks){
                                    datBlock.pointer = block;
                                    datBlock.availableBit = "1";
                                    // Set in session storage
                                    sessionStorage.setItem(datBlockTSB, JSON.stringify(datBlock));
                                    datBlockTSB = block;
                                    datBlock = JSON.parse(sessionStorage.getItem(datBlockTSB));
                                }
                                return true;
                            }
                            else{
                                return false; // we weren't able to find enough free blocks for this file
                            }
                        }
                    }
                }
                // We have a set number of blocks to allocate
                else{
                    while(setBlocks > 0){
                        // If pointer 0:0:0, then we need to find free blocks
                        // Else if it is already pointing to something, we're good already
                        if(datBlock.pointer != "0:0:0"){
                            setBlocks--;
                            // Update pointers
                            datBlockTSB = datBlock.pointer;
                            datBlock = JSON.parse(sessionStorage.getItem(datBlock.pointer));
                        }
                        else{
                            // We reached the end of the blocks that have already been allocated for this file. We need MOAR.
                            // Find enough free data blocks, if can't, return error
                            // First, find out how many more datablocks we need
                            let numBlocks = setBlocks;
                            // Go find that number of free blocks
                            let freeBlocks = this.findFreeDataBlocks(numBlocks); // array of tsbs that are free
                            if(freeBlocks != null){
                                // Once we get those n blocks, mark them as used, then set their pointers accordingly.
                                // Set the current block's pointer to the first block in the array, then recursively set pointers
                                for(var block of freeBlocks){
                                    datBlock.pointer = block;
                                    datBlock.availableBit = "1";
                                    // Set in session storage
                                    sessionStorage.setItem(datBlockTSB, JSON.stringify(datBlock));
                                    datBlockTSB = block;
                                    datBlock = JSON.parse(sessionStorage.getItem(datBlockTSB));
                                }
                                return true;
                            }
                            else{
                                return false; // we weren't able to find enough free blocks for this file
                            }
                        }
                    }
                }
                // Mark the starting block as in use
                datBlock.availableBit = "1";
                sessionStorage.setItem(datBlockTSB, JSON.stringify(datBlock));
                return true;
            }

            // Performs a write given a file name
            public krnDiskWrite(filename: String, text: String) {
                // Look for filename in directrory structure
                let hexArr = this.stringToASCII(filename);
                for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
                    let dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    let matchingFileName = true;
                    // Don't look in blocks not in use
                    if(dirBlock.availableBit == "1"){
                        for(var j=0; j<hexArr.length; j++){
                            if(hexArr[j] != dirBlock.data[j]){
                                matchingFileName = false
                            }
                        }
                        // If reach end of hexArr but dirBlock data still more?
                        if(dirBlock.data[hexArr.length] != "00"){
                            matchingFileName = false;
                        }
                        // We found the filename
                        if(matchingFileName){
                            // Convert the text to a hex array, trimming off quotes
                            let textHexArr = this.stringToASCII(text.slice(1, -1));
                            // Allocates enough free space for the file
                            let enoughFreeSpace: boolean = this.allocateDiskSpace(textHexArr, dirBlock.pointer);
                            if(!enoughFreeSpace){
                                return FULL_DISK_SPACE;
                            }
                            // We have enough allocated space. Get the first datablock, keep writing until no more string.
                            this.writeDiskData(dirBlock.pointer, textHexArr);
                            return FILE_SUCCESS;
                        }
                    }
                }
                return FILE_NAME_NO_EXIST;
            }
            
            /**
             * Device driver's operation for writing data directly to disk
             * As opposed to writing a file's information to disk
             * @param tsb the pointer to the first block to write to
             * @param textHexArr the data to write to disk as an array of hex characters
             */
            public writeDiskData(tsb, textHexArr){
                var dataPtr = 0;
                let currentTSB = tsb;
                console.log("Writing to TSB: " + currentTSB);
                let currentBlock = JSON.parse(sessionStorage.getItem(currentTSB));
                // First, clear out any data that was there previously
                currentBlock = this.clearData(currentBlock);
                for(var k=0; k<textHexArr.length; k++){
                    currentBlock.data[dataPtr] = textHexArr[k];
                    dataPtr++;
                    // Check to see if we've reached the limit of what data the block can hold. If so, go to the next block.
                    if(dataPtr == 60){
                        // Set the block in session storage first
                        sessionStorage.setItem(currentTSB, JSON.stringify(currentBlock));
                        currentTSB = currentBlock.pointer;
                        currentBlock = JSON.parse(sessionStorage.getItem(currentTSB));
                        currentBlock = this.clearData(currentBlock);
                        dataPtr = 0;
                    }
                }
                // If we're done writing, but the pointer in the current block is still pointing to something, it means the old file was longer
                // so delete it all.
                this.krnDiskDeleteData(currentBlock.pointer);
                currentBlock.pointer = "0:0:0";
                // Update session storage
                sessionStorage.setItem(currentTSB, JSON.stringify(currentBlock));
                // Update disk display
                Control.hostDisk();
            }
            
            // Sets a block's bytes to all zeroes
            private clearData(block){
                for(var i=0; i<_Disk.dataSize; i++){
                    block.data[i] = "00";
                }
                return block;
            }

            // Helper method to do a recursively delete starting from some TSB of session storage
            /**
             * Performs a recursive delete given a starting TSB
             * @param tsb the data block to start deleting from
             */
            public krnDiskDeleteData(tsb) {
                let ptrBlock = JSON.parse(sessionStorage.getItem(tsb)); // block that belongs to the TSB
                if(ptrBlock.pointer != "0:0:0"){
                    // follow links
                    this.krnDiskDeleteData(ptrBlock.pointer);
                }
                // remove pointer
                ptrBlock.pointer = "0:0:0";
                // set as available
                ptrBlock.availableBit = "0";
                // update
                sessionStorage.setItem(tsb, JSON.stringify(ptrBlock));
                return;
            }

            /**
             * Returns data stored in a TSB given a TSB
             * @param tsb the data block to start reading from
             * @return a hex array of the data
             */
            public krnDiskReadData(tsb) {
                let dataBlock = JSON.parse(sessionStorage.getItem(tsb));
                // Convert the data retrieved back into a human-readable string
                let dataPtr = 0;
                let res = []; // hex array of data
                while(true){
                    // Read until we reach end of the data block
                    res.push(dataBlock.data[dataPtr]);
                    dataPtr++; 
                    if(dataPtr == _Disk.dataSize){
                        // Go to next TSB if there is a pointer to it.
                        if(dataBlock.pointer != "0:0:0"){
                            dataBlock = JSON.parse(sessionStorage.getItem(dataBlock.pointer));
                            dataPtr = 0;
                        }
                        else{
                            return res;
                        }
                    }
                }
            }

            /**
             * Performs a read on a file given a file name
             */
            public krnDiskRead(filename) {
                // Look for filename in directrory structure
                let hexArr = this.stringToASCII(filename);
                for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
                    let dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    let matchingFileName = true;
                    // Don't look in blocks not in use
                    if(dirBlock.availableBit == "1"){
                        for(var j=0; j<hexArr.length; j++){
                            if(hexArr[j] != dirBlock.data[j]){
                                matchingFileName = false
                            }
                        }
                        // If reach end of hexArr but dirBlock data still more?
                        if(dirBlock.data[hexArr.length] != "00"){
                            matchingFileName = false;
                        }
                        // We found the filename
                        if(matchingFileName){
                            // Perform a recursive read
                            let tsb = dirBlock.pointer;
                            let data = this.krnDiskReadData(tsb);
                            let dataPtr = 0;
                            let fileData = []; // the data in the file
                            while(true){
                                // Read until we reach 00-terminated string
                                if(data[dataPtr] != "00"){
                                    // Avoiding string concatenation to improve runtime
                                    fileData.push(String.fromCharCode(parseInt(data[dataPtr], 16))); // push each char into array
                                    dataPtr++; 
                                }
                                else{
                                    break;
                                }
                            }
                            // Print out file
                            _StdOut.putText(fileData.join(""));
                            // Return success
                            return;
                        }
                    }
                }
                return FILE_NAME_NO_EXIST;
            }

            // Performs a delete given a file name
            public krnDiskDelete(filename) {
                // Look for the filename in the directory structure
                let hexArr = this.stringToASCII(filename);
                for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
                    let dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    let matchingFileName = true;
                    // Don't look in blocks not in use
                    if(dirBlock.availableBit == "1"){
                        for(var j=0; j<hexArr.length; j++){
                            if(hexArr[j] != dirBlock.data[j]){
                                matchingFileName = false
                            }
                        }
                        // If reach end of hexArr but dirBlock data still more?
                        if(dirBlock.data[hexArr.length] != "00"){
                            matchingFileName = false;
                        }
                        // We found the filename
                        if(matchingFileName){
                            // Perform recursive delete given first TSB
                            this.krnDiskDeleteData(dirBlock.pointer);
                            // Update directory block
                            dirBlock.availableBit = "0"
                            dirBlock.pointer = "0:0:0";
                            // Set in storage
                            sessionStorage.setItem(sessionStorage.key(i), JSON.stringify(dirBlock));
                            // Update display
                            Control.hostDisk();
                            return FILE_SUCCESS;
                        }
                    }
                }
                return FILE_NAME_NO_EXIST;
            }

            // Performs a format on the disk by initializing all blocks in all sectors in all tracks on disk
            public krnFormat() {
                // TODO: Return false if a format can't be performed at that time
                // For all values in session storage, set available bit to 0, pointer to 0,0,0, and fill data with 00s
                let zeroes = new Array<String>();
                for(var l=0; l<60; l++){
                    zeroes.push("00");
                }
                for(var i=0; i<_Disk.numOfTracks*_Disk.numOfSectors*_Disk.numOfBlocks; i++){
                    // Get the JSON from the stored string
                    let block = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    block.availableBit = "0";
                    block.pointer = "0:0:0";
                    block.data = zeroes;
                }
                // Update disk display
                Control.hostDisk();
                return true;
            }

            // Return the used directory entries
            public krnLs() {
                // Return the filenames of all directory blocks that are used
                let filenames = [];
                // Don't look in the MBR
                for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
                    let dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    let matchingFileName = true;
                    // Don't look in blocks not in use
                    if(dirBlock.availableBit == "1"){
                        filenames.push(dirBlock.data);
                    }
                }
                // Convert all hex filenames to human-readable form
                for(var i=0; i<filenames.length; i++){
                    let dataPtr = 0;
                    let res = []; // filename
                    while(true){
                        if(filenames[i][dataPtr] != "00"){
                            // Avoiding string concatenation to improve runtime
                            res.push(String.fromCharCode(parseInt(filenames[i][dataPtr], 16))); // push each char into array
                            dataPtr++; 
                        }
                        else{
                            break;
                        }
                    }
                    filenames[i] = res.join("");
                }
                // Return array of filenames
                return filenames;
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
    