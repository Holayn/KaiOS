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
                    public commandHistory = [],             //Stores a history of all commands the user has typed in
                    public commandMatches = [],             //Stores the matches of tab completion
                    public commandMatchCounter = 0,         //Counter to keep track of tab cycle
                    public commandPtr = 0,                  //Counter to keep track of where in the command history we are
                    public numOfWraps = 0) {                //Counter to keep track the number of times we have line wrapped
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
                    // ... and set the pointer to the most recent command ...
                    this.commandPtr = this.commandHistory.length-1;
                    // ... and reset the number of wraps done, user can't delete ...
                    this.numOfWraps = 0;
                    // ... and reset the commands we matched with tab ...
                    this.commandMatches = [];
                    this.commandMatchCounter = 0;
                    // ... and reset our buffer.
                    this.buffer = "";
                }
                else if (chr === String.fromCharCode(8)) { //     Backspace key
                    //Delete the last character from the buffer, clear the line, and redraw the line of text
                    //We need to be able to delete from wrapped lines, so...
                    //Since backspace prints from the starting line, which will cause input to rewrap again
                    //all we need to do is clear all lines that have been wrapped on so we can start anew
                    this.clearCurrentLine();
                    //Wrap -- goes back to the starting line, clearing all the previously wrapped lines along the way
                    while(this.numOfWraps > 0){
                        this.previousLine();
                        this.clearCurrentLine();
                        this.numOfWraps--;
                    }
                    this.putText(_OsShell.promptStr);
                    this.buffer = this.buffer.substring(0, this.buffer.length - 1);
                    this.putText(this.buffer);
                } 
                else if(chr === "up") {         //Up arrow
                    //Recall the previous command and print it to the current line, first clearing the line
                    this.clearCurrentLine();
                    this.putText(_OsShell.promptStr);
                    //Set the pointer to the previous command in preparation for next up keypress
                    if(this.commandPtr != -1){
                        this.commandPtr--;
                    }
                    this.putText(this.commandHistory[this.commandPtr+1]);
                    this.buffer = this.commandHistory[this.commandPtr+1];
                }
                else if(chr === "down") {       //Down arrow
                    //Recall the next command if there is one and print it to the current line, first clearing the line
                    if(this.commandPtr != this.commandHistory.length-1){
                        this.buffer = "";
                        this.clearCurrentLine();
                        this.putText(_OsShell.promptStr);
                        this.commandPtr++;
                        if(this.commandPtr+1 != this.commandHistory.length){
                            this.putText(this.commandHistory[this.commandPtr+1]);
                            this.buffer = this.commandHistory[this.commandPtr+1];
                        }
                    }
                }
                else if(chr === String.fromCharCode(9)){        //tab
                    //See if the user input so far matches any part of the beginning of a command defined in the shell.
                    //Auto-complete the command on the first match.
                    //If more than one match, pressing tab again will go to next match and continue cycling.
                    //We store all matched commands in a command match array.
                    //All we do we is clear the user input and print out the command in its place
                    if(this.commandMatches.length > 1){
                        this.clearCurrentLine();
                        this.putText(_OsShell.promptStr);
                        this.buffer = this.commandMatches[this.commandMatchCounter];
                        this.putText(this.buffer);
                        if(this.commandMatchCounter+1 == this.commandMatches.length){
                            this.commandMatchCounter = 0;
                        }
                        else{
                            this.commandMatchCounter++;
                        }
                    }
                    else{
                        //Get all the commands that match
                        //In cmd.exe, pressing tab on empty input cycles through everything (directories)
                        //We are going to imitate this here, but with commands
                        var regexp = new RegExp("^"+this.buffer, "i");
                        this.commandMatches = [];
                        this.commandMatchCounter = 0;
                        for(var i=0; i<_OsShell.commandList.length; i++){
                            if(regexp.test(_OsShell.commandList[i].command)){
                                //Store all matches commands in an array
                                this.commandMatches.push(_OsShell.commandList[i].command);
                            }
                        }
                        //Checks to see if we matched anything
                        if(this.commandMatches.length != 0){
                            this.clearCurrentLine();
                            this.putText(_OsShell.promptStr);
                            this.buffer = this.commandMatches[this.commandMatchCounter];
                            this.putText(this.buffer);
                            this.commandMatchCounter++;
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
                //LINE-WRAPPING
                //If the line is too long, we have to find where to advance the line
                //This can be a whole line of text, or a single character being drawn
                //So, if a line of text, find where in text that makes the line too long, 
                //then advance the line from there
                if(this.currentXPosition + _DrawingContext.measureText(this.currentFont, this.currentFontSize, text) > _Canvas.width){
                    if(text.length > 1){ //a sentence that makes the line too long.
                        //Find which char in the sentence makes the line too long, advance the line there,
                        //then continue printing rest of line
                        var len = this.currentXPosition;
                        for(var i=0; i<text.length; i++){
                            len += _DrawingContext.measureText(this.currentFont, this.currentFontSize, text.charAt(i));
                            if(len > _Canvas.width){
                                var firstLine = text.substring(0, i);
                                var secondLine = text.substring(i);
                                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, firstLine);
                                this.advanceLine();
                                //Recursive call until the entire line is wrapped
                                this.putText(secondLine);
                                break;
                            }
                        }
                    }
                    else{ //a char that makes the line too long, so just advance the cursor to the next line
                        this.advanceLine();
                        _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                        var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                        this.currentXPosition = this.currentXPosition + offset;
                    }
                    //We have to keep track of the number of wraps so we can clear
                    //the correct number of lines when we delete
                    this.numOfWraps++;
                }
                else{
                    // Draw the text at the current X and Y coordinates.
                    _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                    // Move the current X position.
                    var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                    this.currentXPosition = this.currentXPosition + offset;
                }
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
                //SCROLLING
                //When we advance the line, check to see if it goes offscreen.
                //Save each line to an array, then spit it back out to the canvas but without the first line.
                //For some reason, there were sizing issues (see commented code below) when taking
                //the entire canvas, so my solution was to do each line separately

                // var rectData = _DrawingContext.getImageData(0, 0, _Canvas.width, _Canvas.height);
                // _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
                // _DrawingContext.putImageData(rectData, 0, -lineHeight, 0, 0, _Canvas.width, _Canvas.height);

                for(var i=0; i<_Canvas.height; i+=lineHeight){
                    var lineData = _DrawingContext.getImageData(0, i, _Canvas.width, lineHeight);
                    canvasText.push(lineData);
                }
                for(var i=0; i<canvasText.length; i++){
                    //Start reprinting the lines, but have the first line be above, off-screen from the canvas
                    _DrawingContext.putImageData(canvasText[i], 0, (-lineHeight + i*(lineHeight)), 0, 0, _Canvas.width, _Canvas.height);
                }
            }
            else{
                this.currentYPosition += lineHeight;
            }
        }

        public previousLine(): void {
            //We use this to help us delete wrapped lines, all it does it move the cursor position to the previous line
            let lineHeight = _DefaultFontSize + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) + _FontHeightMargin;
            this.currentYPosition -= lineHeight;
        }

        private clearCurrentLine(): void {
            //Helper function to clear a line
            let lineHeight = _DefaultFontSize + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) + _FontHeightMargin;
            this.currentXPosition = 0;
            _DrawingContext.clearRect(0, this.currentYPosition-lineHeight+5, _Canvas.width, lineHeight*2);
        }
    }
 }
