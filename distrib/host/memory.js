///<reference path="../globals.ts" />
/* ------------
     memory.ts

     Requires global.ts.

     Routines for the host memory simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     ------------ */
var TSOS;
(function (TSOS) {
    var Memory = /** @class */ (function () {
        //Let's just represent the memory as an array of size 768 bytes, 3 partitions of 256
        function Memory(memoryArray) {
            if (memoryArray === void 0) { memoryArray = new Array(768); }
            this.memoryArray = memoryArray;
        }
        Memory.prototype.init = function () {
            this.memoryArray = new Array(768);
        };
        Memory.prototype.loadIntoMemory = function () {
        };
        return Memory;
    }());
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
