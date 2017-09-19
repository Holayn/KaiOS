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
            } else if (((keyCode >= 48) && (keyCode <= 57))){   // digits
                if(isShifted){
                    var to_symbol = {
                        '48':'41',
                        '49':'33',
                        '50':'64',
                        '51':'35',
                        '52':'36',
                        '53':'37',
                        '54':'94',
                        '55':'38',
                        '56':'42',
                        '57':'40'
                    }
                    chr = String.fromCharCode(to_symbol[keyCode]);
                }
                else{
                    chr = String.fromCharCode(keyCode);
                }
                _KernelInputQueue.enqueue(chr);
            } else if(((keyCode == 32)                     ||   // space
                       (keyCode == 13)))                    {   // enter
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);
                //Play a chord when the user presses enter (if PianoTime is enabled)
                if(_PianoTime && keyCode == 13){
                    audio = new Audio('distrib/sound/40.wav');
                    audio.play();
                    audio = new Audio('distrib/sound/44.wav');
                    audio.play();
                    audio = new Audio('distrib/sound/47.wav');
                    audio.play();
                }
            }
            //Since we live in a land of happiness, the keyCode produced from e.which is incorrect for symbols.
            //Characters trigger the onkeypress event. Symbols trigger the onkeydown event.
            //Thus, they return different values. String.fromCharCode won't work on this symbol value.
            //We have to convert the value to ASCII so we can handle it properly with String.fromCharCode
            else if ((keyCode >= 186) && (keyCode <= 222)){
                var to_ascii = {
                    '188': { "notShifted" : '44', "isShifted" : '60' }, // ,
                    '109': { "notShifted" : '45', "isShifted" : '95' }, // -
                    '190': { "notShifted" : '46', "isShifted" : '62' }, // .
                    '191': { "notShifted" : '47', "isShifted" : '63' }, // /
                    '192': { "notShifted" : '96', "isShifted" : '126' }, // `
                    '220': { "notShifted" : '92', "isShifted" : '124' }, // \
                    '222': { "notShifted" : '39', "isShifted" : '34' }, // '
                    '221': { "notShifted" : '93', "isShifted" : '125' }, // ]
                    '219': { "notShifted" : '91', "isShifted" : '123' }, // [
                    '187': { "notShifted" : '61', "isShifted" : '43' }, // ==
                    '186': { "notShifted" : '59', "isShifted" : '58' }, // ;
                    '189': { "notShifted" : '45', "isShifted" : '95' } // -
                }
                if(isShifted){
                    chr = String.fromCharCode(to_ascii[keyCode].isShifted);
                }
                else{
                    chr = String.fromCharCode(to_ascii[keyCode].notShifted);
                }
                _KernelInputQueue.enqueue(chr);
            }
            else if (keyCode == 8){       //backspace
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);
            }
            else if (keyCode == 38){        //up arrow
                _KernelInputQueue.enqueue("up");
            }
            else if (keyCode == 40){        //down arrow
                _KernelInputQueue.enqueue("down");
            }
            else if (keyCode == 9){     //tab
                _KernelInputQueue.enqueue("tab");
            }
        }
    }
}
