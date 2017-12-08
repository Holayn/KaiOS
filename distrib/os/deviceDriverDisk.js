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
        DeviceDriverDisk.prototype.krnDiskCreate = function () {
        };
        // Performs a write given a file name
        DeviceDriverDisk.prototype.krnDiskWrite = function () {
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
            for (var i = 0; i < _Disk.numOfTracks * _Disk.numOfSectors * _Disk.numOfBytes; i++) {
                // Get the JSON from the stored string
                var block = JSON.parse(sessionStorage.getItem(sessionStorage.key(i)));
                block.availableBit = "0";
                block.pointer = ["0", "0", "0"];
                block.data = zeroes;
            }
            return true;
        };
        return DeviceDriverDisk;
    }(TSOS.DeviceDriver));
    TSOS.DeviceDriverDisk = DeviceDriverDisk;
})(TSOS || (TSOS = {}));
