/* ------------
   memoryManager.ts

   This is the client OS implementation of a PCB
   ------------ */
var TSOS;
(function (TSOS) {
    var MemoryManager = /** @class */ (function () {
        function MemoryManager(partitions) {
            this.partitions = partitions;
            this.partitions = [0, 256, 512];
        }
        // For now, we load programs into location 00 of memory, in the first partition.
        // Later, we'll have to change this
        MemoryManager.prototype.loadIntoMemory = function (opCodes) {
            var loadCounter = this.partitions[0];
            for (var _i = 0, opCodes_1 = opCodes; _i < opCodes_1.length; _i++) {
                var opCode = opCodes_1[_i];
                _Memory.memoryArray[loadCounter] = opCode;
                loadCounter++;
            }
            // Fill rest of the partition with 0's
            for (var i = loadCounter; i < this.partitions[1]; i++) {
                _Memory.memoryArray[i] = "00";
            }
            console.log(_Memory.memoryArray);
            // Update the display accordingly
            // _Memory.clearMemory();
            _Memory.updateMemory();
        };
        return MemoryManager;
    }());
    TSOS.MemoryManager = MemoryManager;
})(TSOS || (TSOS = {}));
