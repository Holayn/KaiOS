///<reference path="../globals.ts" />
/* ------------
     disk.ts

     Requires global.ts.

     Contains 3 tracks, with 8 sectors each, each with 8 bytes

     Routines for the host disk simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     ------------ */
var TSOS;
(function (TSOS) {
    var Disk = (function () {
        function Disk() {
            console.log("Init disk");
        }
        Disk.prototype.init = function () {
        };
        return Disk;
    }());
    TSOS.Disk = Disk;
})(TSOS || (TSOS = {}));
