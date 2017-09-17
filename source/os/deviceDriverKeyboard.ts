///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />

/* ----------------------------------
   DeviceDriverKeyboard.ts

   Requires deviceDriver.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */

module TSOS {

    // Extends DeviceDriver
    export class DeviceDriverKeyboard extends DeviceDriver {

        constructor() {
            // Override the base method pointers.

            // The code below cannot run because "this" can only be
            // accessed after calling super.
            //super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            super();
            this.driverEntry = this.krnKbdDriverEntry;
            this.isr = this.krnKbdDispatchKeyPress;
        }

        public krnKbdDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        }

        public krnKbdDispatchKeyPress(params) {
            // Parse the params.    TODO: Check that the params are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
            var chr = "";
            var audio;
            // Check to see if we even want to deal with the key that was pressed.
            if (((keyCode >= 65) && (keyCode <= 90)) ||   // A..Z
                ((keyCode >= 97) && (keyCode <= 123))) {  // a..z {
                // Determine the character we want to display.
                // Assume it's lowercase...
                chr = String.fromCharCode(keyCode + 32);
                // ... then check the shift key and re-adjust if necessary.
                if (isShifted) {
                    chr = String.fromCharCode(keyCode);
                }
                //Play a specific piano note based on the key entered (if PianoTime is enabled)
                if(_PianoTime){
                    var characterToNote = { "a":"64","b":"63","c":"62","d":"61","e":"60","f":"59","g":"58","h":"57","i":"56","j":"55","k":"54","l":"53","m":"52","n":"51","o":"50","p":"49","q":"48","r":"47","s":"46","t":"45","u":"44","v":"43","w":"42","x":"41","y":"40","z":"39" }
                    if(characterToNote[chr] != null){
                        audio = new Audio('distrib/sound/' + characterToNote[chr] + '.wav');
                        audio.play();
                    }
                }
                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);
            } else if (((keyCode >= 48) && (keyCode <= 57)) ||   // digits
                        (keyCode == 32)                     ||   // space
                        (keyCode == 13)) {                       // enter
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);
                //Play a chord when the user presses enter (if PianoTime is enabled)
                if(_PianoTime){
                    audio = new Audio('distrib/sound/40.wav');
                    audio.play();
                    audio = new Audio('distrib/sound/44.wav');
                    audio.play();
                    audio = new Audio('distrib/sound/47.wav');
                    audio.play();
                }
            }
        }
    }
}
