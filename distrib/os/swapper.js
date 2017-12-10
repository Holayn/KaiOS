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
        // Returns the first TSB in the newly allocated memory
        Swapper.prototype.findFreeDiskSpace = function (opcodes) {
        };
        return Swapper;
    }());
    TSOS.Swapper = Swapper;
})(TSOS || (TSOS = {}));
