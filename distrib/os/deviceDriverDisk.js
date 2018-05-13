///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/* ----------------------------------
   DeviceDriverKeyboard.ts

   Requires deviceDriver.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */
var TSOS;
(function (TSOS) {
    // Extends DeviceDriver
    var DeviceDriverDisk = /** @class */ (function (_super) {
        __extends(DeviceDriverDisk, _super);
        function DeviceDriverDisk() {
            // Override the base method pointers.
            var _this = 
            // The code below cannot run because "this" can only be
            // accessed after calling super.
            _super.call(this) || this;
            _this.driverEntry = _this.krnDiskDriverEntry;
            return _this;
        }
        DeviceDriverDisk.prototype.krnDiskDriverEntry = function () {
            // Initialization routine for this, the kernel-mode Disk Device Driver.
            this.status = "loaded";
            // More?
        };
        DeviceDriverDisk.prototype.checkForExistingFile = function (filename) {
            var hexArr = this.stringToASCII(filename);
            for (var sectorNum = 0; sectorNum < _Disk.numOfSectors; sectorNum++) {
                for (var blockNum = 0; blockNum < _Disk.numOfBlocks; blockNum++) {
                    if (sectorNum == 0 && blockNum == 0) {
                        // ignore first block in first sector, it is the MBR
                        continue;
                    }
                    var tsbID = "0" + ":" + sectorNum + ":" + blockNum;
                    var dirBlock = JSON.parse(sessionStorage.getItem(tsbID));
                    var matchingFileName = true;
                    // Don't look in blocks not in use
                    if (dirBlock.availableBit == "1") {
                        for (var k = 4, j = 0; j < hexArr.length; k++, j++) {
                            if (hexArr[j] != dirBlock.data[k]) {
                                matchingFileName = false;
                            }
                        }
                        // If reach end of hexArr but dirBlock data still more?
                        if (dirBlock.data[hexArr.length + DATE_LENGTH] != "00") {
                            matchingFileName = false;
                        }
                        // We found the filename
                        if (matchingFileName) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        // Performs a create given a file name
        DeviceDriverDisk.prototype.krnDiskCreate = function (filename) {
            // Check for existing filename
            if (this.checkForExistingFile(filename)) {
                return FILE_NAME_ALREADY_EXISTS;
            }
            // Look for first free block in directory data structure (first track)
            // Leave out the first block, which is the MBR
            // Firefox doesn't order session storage, so have to generate appropriate tsbID
            // for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
            for (var sectorNum = 0; sectorNum < _Disk.numOfSectors; sectorNum++) {
                for (var blockNum = 0; blockNum < _Disk.numOfBlocks; blockNum++) {
                    if (sectorNum == 0 && blockNum == 0) {
                        // ignore first block in first sector, it is the MBR
                        continue;
                    }
                    var tsbID = "0" + ":" + sectorNum + ":" + blockNum;
                    var dirBlock = JSON.parse(sessionStorage.getItem(tsbID));
                    // If the block is available...
                    if (dirBlock.availableBit == "0") {
                        // Now look for first free block in data structure so we actually have a "place" to put the file
                        var datBlockTSB = this.findFreeDataBlock();
                        if (datBlockTSB != null) {
                            var datBlock = JSON.parse(sessionStorage.getItem(datBlockTSB));
                            dirBlock.availableBit = "1";
                            datBlock.availableBit = "1";
                            // Clear out any data previously in datBlock
                            datBlock = this.clearData(datBlock);
                            dirBlock.pointer = datBlockTSB; // set pointer to space in memory
                            // Convert filename to ASCII/hex and store in data
                            var hexArr = this.stringToASCII(filename);
                            // Clear the directory block's data first a.k.a the filename if it was there before
                            dirBlock = this.clearData(dirBlock);
                            // Get the date and convert it to hex
                            var today = new Date();
                            var month = (today.getMonth() + 1).toString(16);
                            if (month.length == 1) {
                                month = "0" + month; // pad with zero
                            }
                            var day = (today.getDate()).toString(16);
                            if (day.length == 1) {
                                day = "0" + day; // pad with zero
                            }
                            var year = (today.getFullYear()).toString(16);
                            if (year.length == 3) {
                                year = "0" + year; // pad with zero
                            }
                            // Store date in first 4 bytes
                            dirBlock.data[0] = month;
                            dirBlock.data[1] = day;
                            dirBlock.data[2] = year.substring(0, 2);
                            dirBlock.data[3] = year.substring(2);
                            // We only replace the bytes needed, not the entire data array
                            for (var k = 4, j = 0; j < hexArr.length; k++, j++) {
                                dirBlock.data[k] = hexArr[j];
                            }
                            sessionStorage.setItem(tsbID, JSON.stringify(dirBlock));
                            sessionStorage.setItem(datBlockTSB, JSON.stringify(datBlock));
                            // Update the disk display and return success
                            TSOS.Control.hostDisk();
                            return FILE_SUCCESS;
                        }
                        return FULL_DISK_SPACE; // We ran through the data structure but there were no free blocks, meaning no more space on disk :(((((((
                    }
                }
            }
            return FULL_DISK_SPACE; // We ran through the directory data structure but there were no free blocks, meaning no more space on disk :(
        };
        // Return the TSB of the next free data block. If can't find, return null.
        DeviceDriverDisk.prototype.findFreeDataBlock = function () {
            // firefox sucks and doesn't keep session storage in order
            // need to generate proper tsb id
            for (var trackNum = 1; trackNum < _Disk.numOfTracks; trackNum++) {
                for (var sectorNum = 0; sectorNum < _Disk.numOfSectors; sectorNum++) {
                    for (var blockNum = 0; blockNum < _Disk.numOfBlocks; blockNum++) {
                        var tsbID = trackNum + ":" + sectorNum + ":" + blockNum;
                        var datBlock = JSON.parse(sessionStorage.getItem(tsbID));
                        // If the block is available, mark it as unavailable, and set its tsb to the dirBlock pointer
                        if (datBlock.availableBit == "0") {
                            return tsbID;
                        }
                    }
                }
            }
            // for(var j=(_Disk.numOfSectors*_Disk.numOfBlocks); j<(_Disk.numOfTracks*_Disk.numOfSectors*_Disk.numOfBlocks); j++){
            //     var tsbID = trackNum + ":" + sectorNum + ":" + blockNum;
            //     let datBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(j)));
            //     // If the block is available, mark it as unavailable, and set its tsb to the dirBlock pointer
            //     if(datBlock.availableBit == "0"){
            //         return sessionStorage.key(j);
            //     }
            // }
            return null;
        };
        /**
         * Returns the TSBs of free data blocks in some array.
         * If not enough free data blocks are found, then return null.
         * @param numBlocks the number of free blocks to find
         */
        DeviceDriverDisk.prototype.findFreeDataBlocks = function (numBlocks) {
            var blocks = []; // storage for the free blocks
            var startOfDiskIndex = _Disk.numOfSectors * _Disk.numOfBlocks; // This is where the data blocks start in the disk
            var endOfDiskIndex = _Disk.numOfTracks * _Disk.numOfSectors * _Disk.numOfBlocks; // This is where the disk ends
            // firefox sucks and doesn't keep session storage in order
            // need to generate proper tsb id
            // for(var i=startOfDiskIndex; i<endOfDiskIndex; i++){
            for (var trackNum = 1; trackNum < _Disk.numOfTracks; trackNum++) {
                for (var sectorNum = 0; sectorNum < _Disk.numOfSectors; sectorNum++) {
                    for (var blockNum = 0; blockNum < _Disk.numOfBlocks; blockNum++) {
                        var tsbID = trackNum + ":" + sectorNum + ":" + blockNum;
                        var datBlock = JSON.parse(sessionStorage.getItem(tsbID));
                        // If the block is available, push it to the array of free blocks we can use
                        if (datBlock.availableBit == "0") {
                            blocks.push(tsbID);
                            numBlocks--;
                        }
                        // We found enough free blocks
                        if (numBlocks == 0) {
                            return blocks;
                        }
                    }
                }
            }
            if (numBlocks != 0) {
                return null;
            }
        };
        /**
         * Allocates space in the disk by finding enough data blocks to hold the file
         * Returns false if there are not enough free data blocks to do so
         * @param file the file represented as an array of hex digits
         * @param tsb the first TSB in the chain of data blocks
         * @param setBlocks optional parameter that can be passed in order to have a number of blocks set regardless
         */
        DeviceDriverDisk.prototype.allocateDiskSpace = function (file, tsb) {
            // Check size of text. If it is longer than 60, then we need to have enough datablocks
            var stringLength = file.length;
            var datBlockTSB = tsb; // pointer to current block we're looking at
            var datBlock = JSON.parse(sessionStorage.getItem(datBlockTSB));
            // What if data block writing to already pointing to stuff? Then we need to traverse it, making sure there is enough space to hold our new file.
            // Continuously allocate new blocks until we gucci
            while (stringLength > _Disk.dataSize) {
                // If pointer 0:0:0, then we need to find free blocks
                // Else if it is already pointing to something, we're good already
                if (datBlock.pointer != "0:0:0") {
                    stringLength -= _Disk.dataSize;
                    // Update pointers
                    datBlockTSB = datBlock.pointer;
                    datBlock = JSON.parse(sessionStorage.getItem(datBlock.pointer));
                }
                else {
                    // We reached the end of the blocks that have already been allocated for this file. We need MOAR.
                    // Mark the starting block as in use
                    datBlock.availableBit = "1";
                    // Find enough free data blocks, if can't, return error
                    // First, find out how many more datablocks we need
                    var numBlocks = Math.ceil(stringLength / _Disk.dataSize);
                    // Go find that number of free blocks
                    var freeBlocks = this.findFreeDataBlocks(numBlocks); // array of tsbs that are free
                    if (freeBlocks != null) {
                        // Once we get those n blocks, mark them as used, then set their pointers accordingly.
                        // Set the current block's pointer to the first block in the array, then recursively set pointers
                        for (var _i = 0, freeBlocks_1 = freeBlocks; _i < freeBlocks_1.length; _i++) {
                            var block = freeBlocks_1[_i];
                            datBlock.pointer = block;
                            datBlock.availableBit = "1";
                            // Set in session storage
                            sessionStorage.setItem(datBlockTSB, JSON.stringify(datBlock));
                            datBlockTSB = block;
                            datBlock = JSON.parse(sessionStorage.getItem(datBlockTSB));
                        }
                        datBlock.availableBit = "1";
                        sessionStorage.setItem(datBlockTSB, JSON.stringify(datBlock));
                        return true;
                    }
                    else {
                        datBlock.availableBit = "0";
                        return false; // we weren't able to find enough free blocks for this file
                    }
                }
            }
            sessionStorage.setItem(datBlockTSB, JSON.stringify(datBlock));
            return true;
        };
        /**
         * Performs a write given a file name
         * @param filename the filename
         * @param text the text to write in the filename
         */
        DeviceDriverDisk.prototype.krnDiskWrite = function (filename, text) {
            // Look for filename in directrory structure
            var hexArr = this.stringToASCII(filename);
            // Firefox doesn't order session storage, so have to generate appropriate tsbID
            // Don't look in MBR
            // for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
            for (var sectorNum = 0; sectorNum < _Disk.numOfSectors; sectorNum++) {
                for (var blockNum = 0; blockNum < _Disk.numOfBlocks; blockNum++) {
                    if (sectorNum == 0 && blockNum == 0) {
                        // ignore first block in first sector, it is the MBR
                        continue;
                    }
                    var tsbID = "0" + ":" + sectorNum + ":" + blockNum;
                    var dirBlock = JSON.parse(sessionStorage.getItem(tsbID));
                    var matchingFileName = true;
                    // Don't look in blocks not in use
                    if (dirBlock.availableBit == "1") {
                        for (var k = 4, j = 0; j < hexArr.length; k++, j++) {
                            if (hexArr[j] != dirBlock.data[k]) {
                                matchingFileName = false;
                            }
                        }
                        // If reach end of hexArr but dirBlock data still more?
                        if (dirBlock.data[hexArr.length + DATE_LENGTH] != "00") {
                            matchingFileName = false;
                        }
                        // We found the filename
                        if (matchingFileName) {
                            // Convert the text to a hex array, trimming off quotes
                            var textHexArr = this.stringToASCII(text.slice(1, -1));
                            // Allocates enough free space for the file
                            var enoughFreeSpace = this.allocateDiskSpace(textHexArr, dirBlock.pointer);
                            if (!enoughFreeSpace) {
                                return FULL_DISK_SPACE;
                            }
                            // We have enough allocated space. Get the first datablock, keep writing until no more string.
                            this.writeDiskData(dirBlock.pointer, textHexArr);
                            return FILE_SUCCESS;
                        }
                    }
                }
            }
            return FILE_NAME_NO_EXIST;
        };
        /**
         * Device driver's operation for writing data directly to disk
         * As opposed to writing a file's information to disk
         * @param tsb the pointer to the first block to write to
         * @param textHexArr the data to write to disk as an array of hex characters
         */
        DeviceDriverDisk.prototype.writeDiskData = function (tsb, textHexArr) {
            var dataPtr = 0;
            var currentTSB = tsb;
            console.log("Writing to TSB: " + currentTSB);
            var currentBlock = JSON.parse(sessionStorage.getItem(currentTSB));
            // First, clear out any data that was there previously
            currentBlock = this.clearData(currentBlock);
            for (var k = 0; k < textHexArr.length; k++) {
                currentBlock.data[dataPtr] = textHexArr[k];
                dataPtr++;
                // Check to see if we've reached the limit of what data the block can hold. If so, go to the next block.
                if (dataPtr == 60) {
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
            TSOS.Control.hostDisk();
        };
        // Sets a block's bytes to all zeroes
        DeviceDriverDisk.prototype.clearData = function (block) {
            for (var i = 0; i < _Disk.dataSize; i++) {
                block.data[i] = "00";
            }
            return block;
        };
        /**
         * Performs a recursive delete given a starting TSB
         * Don't remove pointers so we can perform chkdsk
         * @param tsb the data block to start deleting from
         */
        DeviceDriverDisk.prototype.krnDiskDeleteData = function (tsb) {
            var ptrBlock = JSON.parse(sessionStorage.getItem(tsb)); // block that belongs to the TSB
            if (ptrBlock.pointer != "0:0:0") {
                // follow links
                this.krnDiskDeleteData(ptrBlock.pointer);
            }
            // ptrBlock.pointer = "0:0:0";
            // set as available
            ptrBlock.availableBit = "0";
            // update
            sessionStorage.setItem(tsb, JSON.stringify(ptrBlock));
            return;
        };
        /**
         * Performs a recursive delete given a starting TSB for a process stored in the TSB
         * Remove pointers!
         */
        DeviceDriverDisk.prototype.krnDiskDeleteProcess = function (tsb) {
            var ptrBlock = JSON.parse(sessionStorage.getItem(tsb)); // block that belongs to the TSB
            if (ptrBlock.pointer != "0:0:0") {
                // follow links
                this.krnDiskDeleteData(ptrBlock.pointer);
            }
            // remove pointer
            ptrBlock.pointer = "0:0:0";
            // set as available
            ptrBlock.availableBit = "0";
            ptrBlock = this.clearData(ptrBlock);
            // update
            sessionStorage.setItem(tsb, JSON.stringify(ptrBlock));
            return;
        };
        /**
         * Returns data stored in a TSB given a TSB
         * @param tsb the data block to start reading from
         * @return a hex array of the data
         */
        DeviceDriverDisk.prototype.krnDiskReadData = function (tsb) {
            var dataBlock = JSON.parse(sessionStorage.getItem(tsb));
            var dataPtr = 0;
            var res = []; // hex array of data
            while (true) {
                // Read until we reach end of the data block
                res.push(dataBlock.data[dataPtr]);
                dataPtr++;
                if (dataPtr == _Disk.dataSize) {
                    // Go to next TSB if there is a pointer to it.
                    if (dataBlock.pointer != "0:0:0") {
                        dataBlock = JSON.parse(sessionStorage.getItem(dataBlock.pointer));
                        dataPtr = 0;
                    }
                    else {
                        return res;
                    }
                }
            }
        };
        /**
         * Performs a read on a file given a file name
         */
        DeviceDriverDisk.prototype.krnDiskRead = function (filename) {
            // Look for filename in directrory structure
            var hexArr = this.stringToASCII(filename);
            // Firefox doesn't order session storage, so have to generate appropriate tsbID
            // Don't look in MBR
            // for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
            for (var sectorNum = 0; sectorNum < _Disk.numOfSectors; sectorNum++) {
                for (var blockNum = 0; blockNum < _Disk.numOfBlocks; blockNum++) {
                    if (sectorNum == 0 && blockNum == 0) {
                        // ignore first block in first sector, it is the MBR
                        continue;
                    }
                    var tsbID = "0" + ":" + sectorNum + ":" + blockNum;
                    var dirBlock = JSON.parse(sessionStorage.getItem(tsbID));
                    var matchingFileName = true;
                    // Don't look in blocks not in use
                    if (dirBlock.availableBit == "1") {
                        for (var k = 4, j = 0; j < hexArr.length; k++, j++) {
                            if (hexArr[j] != dirBlock.data[k]) {
                                matchingFileName = false;
                            }
                        }
                        // If reach end of hexArr but dirBlock data still more?
                        if (dirBlock.data[hexArr.length + DATE_LENGTH] != "00") {
                            matchingFileName = false;
                        }
                        // We found the filename
                        if (matchingFileName) {
                            // Perform a recursive read
                            var tsb = dirBlock.pointer;
                            var data = this.krnDiskReadData(tsb);
                            var dataPtr = 0;
                            var fileData = []; // the data in the file
                            while (true) {
                                // Read until we reach 00-terminated string
                                if (data[dataPtr] != "00") {
                                    // Avoiding string concatenation to improve runtime
                                    fileData.push(String.fromCharCode(parseInt(data[dataPtr], 16))); // push each char into array
                                    dataPtr++;
                                }
                                else {
                                    break;
                                }
                            }
                            // // Print out file
                            // _StdOut.putText(fileData.join(""));
                            // Return success
                            return { "data": data, "fileData": fileData };
                        }
                    }
                }
            }
            return FILE_NAME_NO_EXIST;
        };
        /**
         * Performs a delete given a file name
         * @param filename the filename to delete
         */
        DeviceDriverDisk.prototype.krnDiskDelete = function (filename) {
            // Look for the filename in the directory structure
            var hexArr = this.stringToASCII(filename);
            // Don't look in the MBR
            // Firefox doesn't order session storage, so have to generate appropriate tsbID
            // for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
            for (var sectorNum = 0; sectorNum < _Disk.numOfSectors; sectorNum++) {
                for (var blockNum = 0; blockNum < _Disk.numOfBlocks; blockNum++) {
                    if (sectorNum == 0 && blockNum == 0) {
                        // ignore first block in first sector, it is the MBR
                        continue;
                    }
                    var tsbID = "0" + ":" + sectorNum + ":" + blockNum;
                    var dirBlock = JSON.parse(sessionStorage.getItem(tsbID));
                    var matchingFileName = true;
                    // Don't look in blocks not in use
                    if (dirBlock.availableBit == "1") {
                        for (var k = 4, j = 0; j < hexArr.length; k++, j++) {
                            if (hexArr[j] != dirBlock.data[k]) {
                                matchingFileName = false;
                            }
                        }
                        // If reach end of hexArr but dirBlock data still more?
                        if (dirBlock.data[hexArr.length + DATE_LENGTH] != "00") {
                            matchingFileName = false;
                        }
                        // We found the filename
                        if (matchingFileName) {
                            // Perform recursive delete given first TSB
                            this.krnDiskDeleteData(dirBlock.pointer);
                            // Update directory block
                            dirBlock.availableBit = "0";
                            // Keep the pointer for chkdsk
                            // dirBlock.pointer = "0:0:0"; 
                            // Set in storage
                            sessionStorage.setItem(tsbID, JSON.stringify(dirBlock));
                            // Update display
                            TSOS.Control.hostDisk();
                            return FILE_SUCCESS;
                        }
                    }
                }
            }
            return FILE_NAME_NO_EXIST;
        };
        /**
         * Performs a format on the disk by initializing all blocks in all sectors in all tracks on disk
         * @param formatType the format to perform
         */
        DeviceDriverDisk.prototype.krnFormat = function (formatType) {
            if (_CPU.isExecuting) {
                return false;
            }
            // Just set pointers to 0 and available bit to 0
            if (formatType == QUICK_FORMAT) {
                for (var i = 0; i < _Disk.numOfTracks * _Disk.numOfSectors * _Disk.numOfBlocks; i++) {
                    // Get the JSON from the stored string
                    var block = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    block.availableBit = "0";
                    block.pointer = "0:0:0";
                    sessionStorage.setItem(sessionStorage.key(i), JSON.stringify(block));
                }
            }
            else {
                // For all values in session storage, set available bit to 0, pointer to 0,0,0, and fill data with 00s
                var zeroes = new Array();
                for (var l = 0; l < 60; l++) {
                    zeroes.push("00");
                }
                for (var i = 0; i < _Disk.numOfTracks * _Disk.numOfSectors * _Disk.numOfBlocks; i++) {
                    // Get the JSON from the stored string
                    var block = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                    block.availableBit = "0";
                    block.pointer = "0:0:0";
                    block.data = zeroes;
                    sessionStorage.setItem(sessionStorage.key(i), JSON.stringify(block));
                }
            }
            // Format should also remove any processes that are swapped from the resident queue
            var size = _ProcessManager.residentQueue.getSize();
            for (var i = 0; i < size; i++) {
                var pcb = _ProcessManager.residentQueue.dequeue();
                if (pcb.Swapped) {
                    // Do nothing, goodbye PCB!
                }
                else {
                    _ProcessManager.residentQueue.enqueue(pcb); // put the process back into the resident queue
                }
            }
            // Update disk display
            TSOS.Control.hostDisk();
            return true;
        };
        /**
         * Gets size of a file given its initial TSB
         * Just performs a read and then gets the length of the data returned
         */
        DeviceDriverDisk.prototype.getSize = function (tsb) {
            return this.krnDiskReadData(tsb).length;
        };
        // Return the used directory entries
        DeviceDriverDisk.prototype.krnLs = function () {
            // Return the filenames of all directory blocks that are used
            var filenames = [];
            // Don't look in the MBR
            // Firefox doesn't order session storage, so have to generate appropriate tsbID
            for (var sectorNum = 0; sectorNum < _Disk.numOfSectors; sectorNum++) {
                for (var blockNum = 0; blockNum < _Disk.numOfBlocks; blockNum++) {
                    if (sectorNum == 0 && blockNum == 0) {
                        // ignore first block in first sector, it is the MBR
                        continue;
                    }
                    var tsbID = "0" + ":" + sectorNum + ":" + blockNum;
                    var dirBlock = JSON.parse(sessionStorage.getItem(tsbID));
                    // Don't look in blocks not in use
                    if (dirBlock.availableBit == "1") {
                        var size = this.getSize(dirBlock.pointer);
                        var info = {
                            data: dirBlock.data,
                            size: size + "bytes"
                        };
                        filenames.push(info);
                    }
                }
            }
            // for(var i=1; i<_Disk.numOfSectors*_Disk.numOfBlocks; i++){
            // var tsbID = "1" + ":" + sectorNum + ":" + blockNum;
            // let dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
            // // Don't look in blocks not in use
            // if(dirBlock.availableBit == "1"){
            //     let size = this.getSize(dirBlock.pointer);
            //     let info = {
            //         data: dirBlock.data,
            //         size: size + "bytes"
            //     }
            //     filenames.push(info);
            // }
            // }
            // Convert all hex filenames to human-readable form
            for (var i = 0; i < filenames.length; i++) {
                var dataPtr = 4;
                var res = []; // filename
                while (true) {
                    if (filenames[i]['data'][dataPtr] != "00") {
                        // Avoiding string concatenation to improve runtime
                        res.push(String.fromCharCode(parseInt(filenames[i]['data'][dataPtr], 16))); // push each char into array
                        dataPtr++;
                    }
                    else {
                        break;
                    }
                }
                filenames[i]['name'] = res.join("");
                // Parse out the date
                filenames[i]['month'] = parseInt(filenames[i]['data'][0], 16);
                filenames[i]['day'] = parseInt(filenames[i]['data'][1], 16);
                filenames[i]['year'] = parseInt(filenames[i]['data'][2] + filenames[i]['data'][3], 16);
            }
            // Return array of filenames
            return filenames;
        };
        /**
         * Performs a recovery of deleted files by just looking at all directory blocks to see
         * if there is a pointer still existing when the available bit is flipped off
         */
        DeviceDriverDisk.prototype.krnChkDsk = function () {
            for (var i = 0; i < _Disk.numOfTracks * _Disk.numOfSectors * _Disk.numOfBlocks; i++) {
                // Get the JSON from the stored string
                var block = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                if (block.availableBit = "0" && block.pointer != "0:0:0") {
                    block.availableBit = "1";
                    sessionStorage.setItem(sessionStorage.key(i), JSON.stringify(block));
                    // Update disk display
                    TSOS.Control.hostDisk();
                }
            }
        };
        // Helper method to convert string to ASCII to hex
        // Returns an array of each character represented as hex
        DeviceDriverDisk.prototype.stringToASCII = function (string) {
            var hexArr = [];
            // Look at each character's ASCII value and convert it to a hex string
            for (var i = 0; i < string.length; i++) {
                var hexChar = string.charCodeAt(i).toString(16);
                hexArr.push(hexChar);
            }
            return hexArr;
        };
        return DeviceDriverDisk;
    }(TSOS.DeviceDriver));
    TSOS.DeviceDriverDisk = DeviceDriverDisk;
})(TSOS || (TSOS = {}));
