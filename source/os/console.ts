///<reference path="../globals.ts" />

/* ------------
     Console.ts

     Requires globals.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */

module TSOS {

    export class Console {

        constructor(public currentFont = _DefaultFontFamily,
                    public currentFontSize = _DefaultFontSize,
                    public currentXPosition = 0,
                    public currentYPosition = _DefaultFontSize,
                    public buffer = "",
                    public commandHistory = [],
                    public commandPtr = 0) {
        }

        public init(): void {
            this.clearScreen();
            this.resetXY();
        }

        private clearScreen(): void {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }

        private resetXY(): void {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }

        public handleInput(): void {
            var audio;
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) { //     Enter key
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);
                    // ... and add it to the history of commands ...
                    this.commandHistory.push(this.buffer);
                    this.commandPtr = this.commandHistory.length-1;
                    // ... and reset our buffer.
                    this.buffer = "";
                }
                else if (chr === String.fromCharCode(8)) { //     Backspace key
                    //Delete the last character from the buffer, clear the line, and redraw the line of text
                    this.clearCurrentLine();
                    this.buffer = this.buffer.substring(0, this.buffer.length - 1);
                    this.putText(this.buffer);
                } 
                else if(chr === "up") {
                    //Recall the previous command and print it to the current line, first clearing the line
                    this.clearCurrentLine();
                    if(this.commandPtr != -1){
                        this.commandPtr--;
                    }
                    this.putText(this.commandHistory[this.commandPtr+1]);
                    this.buffer = this.commandHistory[this.commandPtr+1];
                }
                else if(chr === "down") {
                    //Recall the next command if there is one and print it to the current line, first clearing the line
                    if(this.commandPtr != this.commandHistory.length-1){
                        this.buffer = "";
                        this.clearCurrentLine();
                        this.commandPtr++;
                        if(this.commandPtr+1 != this.commandHistory.length){
                            this.putText(this.commandHistory[this.commandPtr+1]);
                            this.buffer = this.commandHistory[this.commandPtr+1];
                        }
                    }
                }
                else if(chr === "tab"){
                    //See if the user input so far matches any part of the beginning of a command defined in the shell.
                    //Auto-complete the command on the first match
                    var regexp = new RegExp("^"+this.buffer, "i");
                    for(var i=0; i<_OsShell.commandList.length; i++){
                        if(regexp.test(_OsShell.commandList[i].command)){
                            this.clearCurrentLine();
                            this.buffer = _OsShell.commandList[i].command;
                            this.putText(this.buffer);
                            break;
                        }
                    }
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                }
                // TODO: Write a case for Ctrl-C.
            }
        }

        public putText(text): void {
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
         }

        public advanceLine(): void {
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            
            let lineHeight = _DefaultFontSize + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) + _FontHeightMargin;

            /*
             * This checks to see if the output will go off the screen
             * If it does, then we handle scrolling by saving the image data of the canvas, then
             * redrawing the canvas with the image data being drawn starting from a line height further off the screen.
             */
            var canvasText = [];
            if(this.currentYPosition+lineHeight >= _Canvas.height){
                // var rectData = _DrawingContext.getImageData(0, 0, _Canvas.width, _Canvas.height);
                // _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
                // _DrawingContext.putImageData(rectData, 0, -lineHeight, 0, 0, _Canvas.width, _Canvas.height);

                //Save each line to an array, then spit it back out to the canvas but without the first one.
                for(var i=0; i<_Canvas.height; i+=lineHeight){
                    var lineData = _DrawingContext.getImageData(0, i, _Canvas.width, lineHeight);
                    canvasText.push(lineData);
                }
                for(var i=0; i<canvasText.length; i++){
                    _DrawingContext.putImageData(canvasText[i], 0, (-lineHeight + i*(lineHeight)), 0, 0, _Canvas.width, _Canvas.height);
                }
            }
            else{
                this.currentYPosition += lineHeight;
            }
        }

        private clearCurrentLine(): void {
            let lineHeight = _DefaultFontSize + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) + _FontHeightMargin;
            this.currentXPosition = 0;
            _DrawingContext.clearRect(0, this.currentYPosition-lineHeight+5, _Canvas.width, lineHeight*2);
            this.putText(_OsShell.promptStr);
        }
    }
 }
