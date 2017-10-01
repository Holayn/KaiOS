/* ------------
   memoryManager.ts

   This is the client OS implementation of a PCB
   ------------ */
var TSOS;
(function (TSOS) {
    var MemoryManager = /** @class */ (function () {
        function MemoryManager(base) {
            this.base = base;
            this.limit = 256;
            this.base = [0, 256, 512];
        }
        // For now, we load programs into location 00 of memory, in the first partition.
        // Later, we'll have to change this
        MemoryManager.prototype.loadIntoMemory = function (opCodes) {
            var loadCounter = this.base[0];
            for (var _i = 0, opCodes_1 = opCodes; _i < opCodes_1.length; _i++) {
                var opCode = opCodes_1[_i];
                _Memory.memoryArray[loadCounter] = opCode;
                loadCounter++;
            }
            // Fill rest of the partitions with 0's
            for (var i = loadCounter; i < this.limit; i++) {
                _Memory.memoryArray[i] = "00";
            }
            console.log(_Memory.memoryArray);
            // Update the display accordingly
            // _Memory.clearMemory();
            TSOS.Control.hostMemory();
        };
        // Checks to see if there is an available partition in memory
        // For now, we'll only check the first partition to see if it's available
        // If there is, we should keep track what the base register is
        // This really should be the scheduler's job, but not implementing
        // that yet.
        MemoryManager.prototype.checkMemory = function () {
            for (var i = this.base[0]; i < this.limit; i++) {
                if (_Memory.memoryArray[i] != "00") {
                    return false;
                }
            }
            return true;
        };
        // The only base register we care about for now is the one
        // for the first partition.
        MemoryManager.prototype.getBaseRegister = function () {
            return 0;
        };
        MemoryManager.prototype.getLimitRegister = function () {
            return this.limit;
        };
        return MemoryManager;
    }());
    TSOS.MemoryManager = MemoryManager;
})(TSOS || (TSOS = {}));
