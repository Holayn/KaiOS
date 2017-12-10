/* ------------
   swapper.ts

   This is the client OS implementation of a swapper.
   This is responsible for keeping track of all the processes in the OS,
   as well as creating, saving, and exiting them.
   PROJECT 2: NOT UPDATING PCB BECAUSE WE NEVER DO A CONTEXT SWITCH.
   ------------ */
var TSOS;
(function (TSOS) {
    var Swapper = /** @class */ (function () {
        function Swapper() {
        }
        // Calls the disk device driver to find enough space to store the program
        // Returns the first TSB of the newly allocated data block
        Swapper.prototype.putProcessToDisk = function (opcodes) {
            // First, find a free data block to hold the opcodes
            var tsb = _krnDiskDriver.findFreeDataBlock();
            // Now, call the device driver's allocate disk space to see if need more data blocks to hold the opcodes
            // This will allocate those blocks as being used and update pointers
            var enoughFreeSpace = _krnDiskDriver.allocateDiskSpace(opcodes, tsb);
            if (!enoughFreeSpace) {
                return null;
            }
            else {
                // Write the opcodes to disk
                _krnDiskDriver.writeDiskData(tsb, opcodes);
                return tsb;
            }
        };
        return Swapper;
    }());
    TSOS.Swapper = Swapper;
})(TSOS || (TSOS = {}));
