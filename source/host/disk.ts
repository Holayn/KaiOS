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

module TSOS {

    export class Disk {
        public numOfTracks: number = 3;
        public numOfSectors: number = 8;
        public numOfBytes: number = 8;
        constructor() {}

        public init() {
            // Init storage
            // Key value of { "track:sector:byte"  : "00000..."}
            for(var i=0; i<this.numOfTracks; i++){
                for(var j=0; j<this.numOfSectors; j++){
                    for(var k=0; k<this.numOfBytes; k++){
                        var key = i + ":" + j + ":" + k;
                        var zeroes = new Array<Number>();
                        for(var l=0; l<64; l++){
                            zeroes.push(0);
                        }
                        sessionStorage.setItem(key,"")
                    }
                }
            }
            sessionStorage.setItem("0", "");
        }
    }
}
