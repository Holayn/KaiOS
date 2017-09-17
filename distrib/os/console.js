///<reference path="../globals.ts" />
/* ------------
     Console.ts

     Requires globals.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */
var TSOS;
(function (TSOS) {
    var Console = /** @class */ (function () {
        function Console(currentFont, currentFontSize, currentXPosition, currentYPosition, buffer) {
            if (currentFont === void 0) { currentFont = _DefaultFontFamily; }
            if (currentFontSize === void 0) { currentFontSize = _DefaultFontSize; }
            if (currentXPosition === void 0) { currentXPosition = 0; }
            if (currentYPosition === void 0) { currentYPosition = _DefaultFontSize; }
            if (buffer === void 0) { buffer = ""; }
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.buffer = buffer;
        }
        Console.prototype.init = function () {
            this.clearScreen();
            this.resetXY();
        };
        Console.prototype.clearScreen = function () {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        };
        Console.prototype.resetXY = function () {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        };
        Console.prototype.handleInput = function () {
            var audio;
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) {
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);
                    //If PianoTime is enabled, play a chord
                    if (_PianoTime) {
                        audio = new Audio('distrib/sound/40.wav');
                        audio.play();
                        audio = new Audio('distrib/sound/44.wav');
                        audio.play();
                        audio = new Audio('distrib/sound/47.wav');
                        audio.play();
                    }
                    // ... and reset our buffer.
                    this.buffer = "";
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                    //Now, based on the character that was entered, play a specific piano note...only if PianoTime is enabled
                    if (_PianoTime) {
                        var characterToNote = { "a": "64", "b": "63", "c": "62", "d": "61", "e": "60", "f": "59", "g": "58", "h": "57", "i": "56", "j": "55", "k": "54", "l": "53", "m": "52", "n": "51", "o": "50", "p": "49", "q": "48", "r": "47", "s": "46", "t": "45", "u": "44", "v": "43", "w": "42", "x": "41", "y": "40", "z": "39" };
                        if (characterToNote[chr] != null) {
                            audio = new Audio('distrib/sound/' + characterToNote[chr] + '.wav');
                            audio.play();
                        }
                    }
                }
                // TODO: Write a case for Ctrl-C.
            }
        };
        Console.prototype.putText = function (text) {
            // My first inclination here was to write two functions: putChar() and putString().
            // Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
            // between the two.  So rather than be like PHP and write two (or more) functions that
            // do the same thing, thereby encouraging confusion and decreasing readability, I
            // decided to write one function and use the term "text" to connote string or char.
            //
            // UPDATE: Even though we are now working in TypeScript, char and string remain undistinguished.
            //         Consider fixing that.
            if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                // Move the current X position.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition + offset;
            }
        };
        Console.prototype.advanceLine = function () {
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            var lineHeight = _DefaultFontSize + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) + _FontHeightMargin;
            /*
             * This checks to see if the output will go off the screen
             * If it does, then we handle scrolling by saving the image data of the canvas, clearing the canvas, then
             * redrawing the canvas with the image data being drawn starting from a line height further off the screen.
             */
            var canvasText = [];
            if (this.currentYPosition + lineHeight >= _Canvas.height) {
                // var rectData = _DrawingContext.getImageData(0, 0, _Canvas.width, _Canvas.height);
                // _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
                // _DrawingContext.putImageData(rectData, 0, -lineHeight, 0, 0, _Canvas.width, _Canvas.height);
                //Save each line to an array, then spit it back out to the canvas but without the first one.
                for (var i = 0; i < _Canvas.height; i += lineHeight) {
                    var lineData = _DrawingContext.getImageData(0, i, _Canvas.width, lineHeight);
                    canvasText.push(lineData);
                }
                for (var i = 0; i < canvasText.length; i++) {
                    _DrawingContext.putImageData(canvasText[i], 0, (-lineHeight + i * (lineHeight)), 0, 0, _Canvas.width, _Canvas.height);
                }
            }
            else {
                this.currentYPosition += lineHeight;
            }
        };
        return Console;
    }());
    TSOS.Console = Console;
})(TSOS || (TSOS = {}));
