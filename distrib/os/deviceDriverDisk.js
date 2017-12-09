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
            for (var i = 1; i < _Disk.numOfSectors * _Disk.numOfBlocks; i++) {
                var dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                var matchingFileName = true;
                // Don't look in blocks not in use
                if (dirBlock.availableBit == "1") {
                    for (var j = 0; j < hexArr.length; j++) {
                        if (hexArr[j] != dirBlock.data[j]) {
                            matchingFileName = false;
                        }
                    }
                    // If reach end of hexArr but dirBlock data still more?
                    if (dirBlock.data[hexArr.length] != "00") {
                        matchingFileName = false;
                    }
                    // We found the filename
                    if (matchingFileName) {
                        return true;
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
            for (var i = 1; i < _Disk.numOfSectors * _Disk.numOfBlocks; i++) {
                var dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                // If the block is available, set the passed filename in the data
                if (dirBlock.availableBit == "0") {
                    // Now look for first free block in data structure so we actually have a "place" to put the file
                    var datBlockIndex = this.findFreeDataBlock();
                    if (datBlockIndex != null) {
                        var datBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(datBlockIndex)));
                        dirBlock.availableBit = "1";
                        datBlock.availableBit = "1";
                        dirBlock.pointer = sessionStorage.key(datBlockIndex); // set pointer to space in memory
                        // Convert filename to ASCII/hex and store in data
                        var hexArr = this.stringToASCII(filename);
                        // Clear the directory block's data first a.k.a the filename if it was there before
                        dirBlock = this.clearData(dirBlock);
                        // We only replace the bytes needed, not the entire data array
                        for (var k = 0; k < hexArr.length; k++) {
                            dirBlock.data[k] = hexArr[k];
                        }
                        sessionStorage.setItem(sessionStorage.key(i), JSON.stringify(dirBlock));
                        sessionStorage.setItem(sessionStorage.key(datBlockIndex), JSON.stringify(datBlock));
                        // Update the disk display and return success
                        TSOS.Control.hostDisk();
                        return FILE_SUCCESS;
                    }
                    return FULL_DISK_SPACE; // We ran through the data structure but there were no free blocks, meaning no more space on disk :(((((((
                }
            }
            return FULL_DISK_SPACE; // We ran through the directory data structure but there were no free blocks, meaning no more space on disk :(
        };
        // Return the session storage index of the next free data block. If can't find, return null.
        DeviceDriverDisk.prototype.findFreeDataBlock = function () {
            for (var j = (_Disk.numOfSectors * _Disk.numOfBlocks); j < (_Disk.numOfTracks * _Disk.numOfSectors * _Disk.numOfBlocks); j++) {
                var datBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(j)));
                // If the block is available, mark it as unavailable, and set its tsb to the dirBlock pointer
                if (datBlock.availableBit == "0") {
                    return j;
                }
            }
            return null;
        };
        // Performs a write given a file name
        DeviceDriverDisk.prototype.krnDiskWrite = function (filename, text) {
            // Look for filename in directrory structure
            var hexArr = this.stringToASCII(filename);
            for (var i = 1; i < _Disk.numOfSectors * _Disk.numOfBlocks; i++) {
                var dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                var matchingFileName = true;
                // Don't look in blocks not in use
                if (dirBlock.availableBit == "1") {
                    for (var j = 0; j < hexArr.length; j++) {
                        if (hexArr[j] != dirBlock.data[j]) {
                            matchingFileName = false;
                        }
                    }
                    // If reach end of hexArr but dirBlock data still more?
                    if (dirBlock.data[hexArr.length] != "00") {
                        matchingFileName = false;
                    }
                    // We found the filename
                    if (matchingFileName) {
                        // Convert the text to a hex array, trimming off 
                        var textHexArr = this.stringToASCII(text.slice(1, -1));
                        // Check size of text. If it is longer than 60, then we need to have enough datablocks
                        var stringLength = textHexArr.length;
                        var datBlockTSB = dirBlock.pointer; // pointer to current block we're looking at
                        var datBlock = JSON.parse(sessionStorage.getItem(dirBlock.pointer));
                        // Keep track of the last block that was already allocated for this file
                        // This is so we know what to start to delete from so we don't delete what we had before, if we run out of memory while allocating new blocks.
                        var lastAlreadyAllocdBlockTSB = dirBlock.pointer;
                        // What if data block writing to already pointing to stuff? Then we need to traverse it.
                        // Continuously allocate new blocks until we gucci
                        while (stringLength > _Disk.dataSize) {
                            // If pointer 0:0:0, then we need to find free blocks
                            // Else if it is already pointing to something, we're good already
                            if (datBlock.pointer != "0:0:0") {
                                stringLength -= _Disk.dataSize;
                                // Update to keep track of last block that was already allocated for this file so later we can delete appropriately
                                lastAlreadyAllocdBlockTSB = datBlock.pointer;
                                // Update pointers
                                datBlockTSB = datBlock.pointer;
                                datBlock = JSON.parse(sessionStorage.getItem(datBlock.pointer));
                            }
                            else {
                                // We reached the end of the blocks that have already been allocated for this file. We need MOAR.
                                // Find enough free data blocks, if can't, return error
                                var nextFreeBlockIndex = this.findFreeDataBlock();
                                if (nextFreeBlockIndex != null) {
                                    stringLength -= _Disk.dataSize;
                                    // Found a free datablock, mark it as used
                                    var nextFreeBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(nextFreeBlockIndex)));
                                    nextFreeBlock.availableBit = "1";
                                    // Update allocated block in session storage
                                    sessionStorage.setItem(sessionStorage.key(nextFreeBlockIndex), JSON.stringify(nextFreeBlock));
                                    // Set the pointer to this new free datablock in the previous data block
                                    datBlock.pointer = sessionStorage.key(nextFreeBlockIndex);
                                    // Update that in storage
                                    sessionStorage.setItem(datBlockTSB, JSON.stringify(datBlock));
                                    // Update pointers
                                    datBlockTSB = datBlock.pointer;
                                    datBlock = JSON.parse(sessionStorage.getItem(datBlock.pointer));
                                }
                                else {
                                    // Couldn't find free data block. Not enough space to write string to disk. String was probably very long
                                    // Make sure to go back and make the data blocks that were marked "used" as free during allocation process
                                    // Perform a recursive delete starting from the first 
                                    // But wait, we don't want to delete what's already there.
                                    // So go to the last already existing block for the file, and start deleting starting with the block it is pointing to
                                    var ptrBlock = JSON.parse(sessionStorage.getItem(lastAlreadyAllocdBlockTSB));
                                    this.recurseDelete(ptrBlock.pointer);
                                    return FULL_DISK_SPACE;
                                }
                            }
                        }
                        // We have enough allocated space. Get the first datablock, recursively write string.
                        var dataPtr = 0;
                        var currentTSB = dirBlock.pointer;
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
                        this.recurseDelete(currentBlock.pointer);
                        currentBlock.pointer = "0:0:0";
                        // Update session storage
                        sessionStorage.setItem(currentTSB, JSON.stringify(currentBlock));
                        // Update disk display
                        TSOS.Control.hostDisk();
                        return FILE_SUCCESS;
                    }
                }
            }
            return FILE_NAME_NO_EXIST;
        };
        // Sets a block's bytes to all zeroes
        DeviceDriverDisk.prototype.clearData = function (block) {
            for (var i = 0; i < _Disk.dataSize; i++) {
                block.data[i] = "00";
            }
            return block;
        };
        // Helper method to do a recursively delete starting from some TSB of session storage
        DeviceDriverDisk.prototype.recurseDelete = function (tsb) {
            var ptrBlock = JSON.parse(sessionStorage.getItem(tsb)); // block that belongs to the TSB
            if (ptrBlock.pointer != "0:0:0") {
                // follow links
                this.recurseDelete(ptrBlock.pointer);
            }
            // remove pointer
            ptrBlock.pointer = "0:0:0";
            // set as available
            ptrBlock.availableBit = "0";
            // update
            sessionStorage.setItem(tsb, JSON.stringify(ptrBlock));
            return;
        };
        // Performs a read given a file name
        DeviceDriverDisk.prototype.krnDiskRead = function (filename) {
            // Look for filename in directrory structure
            var hexArr = this.stringToASCII(filename);
            for (var i = 1; i < _Disk.numOfSectors * _Disk.numOfBlocks; i++) {
                var dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                var matchingFileName = true;
                // Don't look in blocks not in use
                if (dirBlock.availableBit == "1") {
                    for (var j = 0; j < hexArr.length; j++) {
                        if (hexArr[j] != dirBlock.data[j]) {
                            matchingFileName = false;
                        }
                    }
                    // If reach end of hexArr but dirBlock data still more?
                    if (dirBlock.data[hexArr.length] != "00") {
                        matchingFileName = false;
                    }
                    // We found the filename
                    if (matchingFileName) {
                        // Perform a recursive read
                        var tsb = dirBlock.pointer;
                        var dataBlock = JSON.parse(sessionStorage.getItem(tsb));
                        // Convert the data retrieved back into a human-readable string
                        var dataPtr = 0;
                        var res = []; // File 
                        while (true) {
                            // Read until we reach 00-terminated string
                            if (dataBlock.data[dataPtr] != "00") {
                                // Avoiding string concatenation to improve runtime
                                res.push(String.fromCharCode(parseInt(dataBlock.data[dataPtr], 16))); // push each char into array
                                dataPtr++;
                                if (dataPtr == _Disk.dataSize) {
                                    // Go to next TSB
                                    if (dataBlock.pointer != "0:0:0") {
                                        dataBlock = JSON.parse(sessionStorage.getItem(dataBlock.pointer));
                                    }
                                    dataPtr = 0;
                                }
                            }
                            else {
                                break;
                            }
                        }
                        // Print out file
                        _StdOut.putText(res.join(""));
                        // Return success
                        return;
                    }
                }
            }
            return FILE_NAME_NO_EXIST;
        };
        // Performs a delete given a file name
        DeviceDriverDisk.prototype.krnDiskDelete = function (filename) {
            var hexArr = this.stringToASCII(filename);
            for (var i = 1; i < _Disk.numOfSectors * _Disk.numOfBlocks; i++) {
                var dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                var matchingFileName = true;
                // Don't look in blocks not in use
                if (dirBlock.availableBit == "1") {
                    for (var j = 0; j < hexArr.length; j++) {
                        if (hexArr[j] != dirBlock.data[j]) {
                            matchingFileName = false;
                        }
                    }
                    // If reach end of hexArr but dirBlock data still more?
                    if (dirBlock.data[hexArr.length] != "00") {
                        matchingFileName = false;
                    }
                    // We found the filename
                    if (matchingFileName) {
                        // Perform recursive delete given first TSB
                        this.recurseDelete(dirBlock.pointer);
                        // Update directory block
                        dirBlock.availableBit = "0";
                        dirBlock.pointer = "0:0:0";
                        // Set in storage
                        sessionStorage.setItem(sessionStorage.key(i), JSON.stringify(dirBlock));
                        // Update display
                        TSOS.Control.hostDisk();
                        return FILE_SUCCESS;
                    }
                }
            }
            return FILE_NAME_NO_EXIST;
        };
        // Performs a format on the disk by initializing all blocks in all sectors in all tracks on disk
        DeviceDriverDisk.prototype.krnFormat = function () {
            // TODO: Return false if a format can't be performed at that time
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
            }
            // Update disk display
            TSOS.Control.hostDisk();
            return true;
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
