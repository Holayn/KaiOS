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
        // Performs a create given a file name
        DeviceDriverDisk.prototype.krnDiskCreate = function (filename) {
            // TODO: Return false if there is no more space on the disk
            // Look for first free block in directory data structure (first track)
            // Leave out the first block, which is the MBR
            for (var i = 1; i < _Disk.numOfSectors * _Disk.numOfBlocks; i++) {
                var dirBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                // If the block is available, set the passed filename in the data
                if (dirBlock.availableBit == "0") {
                    // Now look for first free block in data structure so we actually have a "place" to put the file
                    for (var j = (_Disk.numOfSectors * _Disk.numOfBlocks); j < (_Disk.numOfTracks * _Disk.numOfSectors * _Disk.numOfBlocks); j++) {
                        var datBlock = JSON.parse(sessionStorage.getItem(sessionStorage.key(j)));
                        // If the block is available, mark it as unavailable, and set its tsb to the dirBlock pointer
                        if (datBlock.availableBit == "0") {
                            dirBlock.availableBit = "1";
                            datBlock.availableBit = "1";
                            dirBlock.pointer = sessionStorage.key(j); // set pointer to space in memory
                            // Convert filename to ASCII/hex and store in data
                            var hexArr = this.stringToASCII(filename);
                            // We only replace the bytes needed, not the entire data array
                            for (var k = 0; k < hexArr.length; k++) {
                                dirBlock.data[k] = hexArr[k];
                            }
                            sessionStorage.setItem(sessionStorage.key(i), JSON.stringify(dirBlock));
                            sessionStorage.setItem(sessionStorage.key(j), JSON.stringify(datBlock));
                            // Update the disk display and return success
                            TSOS.Control.hostDisk();
                            return true;
                        }
                    }
                }
            }
            return false; // We ran through the directory data structure but there were no free blocks, meaning no more space on disk :(
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
        // Performs a write given a file name
        DeviceDriverDisk.prototype.krnDiskWrite = function () {
            // Look for free block in data structure
        };
        // Performs a read given a file name
        DeviceDriverDisk.prototype.krnDiskRead = function () {
        };
        // Performs a delete given a file name
        DeviceDriverDisk.prototype.krnDiskDelete = function () {
        };
        // Performs a format on the disk by initializing all blocks in all sectors in all tracks on disk
        DeviceDriverDisk.prototype.krnFormat = function () {
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
            // TODO: Return false if a format can't be performed at that time
            return true;
        };
        return DeviceDriverDisk;
    }(TSOS.DeviceDriver));
    TSOS.DeviceDriverDisk = DeviceDriverDisk;
})(TSOS || (TSOS = {}));
