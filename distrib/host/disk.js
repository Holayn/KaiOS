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
    var Disk = /** @class */ (function () {
        function Disk() {
            this.numOfTracks = 4; // The number of tracks on the disk
            this.numOfSectors = 8; // The number of sectors in each track
            this.numOfBlocks = 8; // The number of blocks in each sector
            this.dataSize = 60; // The actual amount of bytes we can write data to.
        }
        Disk.prototype.init = function () {
            // Init storage
            for (var i = 0; i < this.numOfTracks; i++) {
                for (var j = 0; j < this.numOfSectors; j++) {
                    for (var k = 0; k < this.numOfBlocks; k++) {
                        var key = i + ":" + j + ":" + k;
                        var zeroes = new Array();
                        for (var l = 0; l < this.dataSize; l++) {
                            zeroes.push("00");
                        }
                        var block = {
                            availableBit: "0",
                            pointer: ["0:0:0"],
                            data: zeroes // Rest of 64 bytes is filled with data
                        };
                        sessionStorage.setItem(key, JSON.stringify(block));
                    }
                }
            }
        };
        return Disk;
    }());
    TSOS.Disk = Disk;
})(TSOS || (TSOS = {}));
