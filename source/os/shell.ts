///<reference path="../globals.ts" />
///<reference path="../utils.ts" />
///<reference path="shellCommand.ts" />
///<reference path="userCommand.ts" />
///<reference path="processControlBlock.ts" />
///<reference path="memoryManager.ts" />


/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

module TSOS {
    export class Shell {
        // Properties
        public promptStr = ">";
        public commandList = [];
        public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        public apologies = "[sorry]";

        constructor(){}

        public init() {
            var sc;
            //
            // Load the command list.

            // ver
            sc = new ShellCommand(this.shellVer,
                                  "ver",
                                  "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;

            // help
            sc = new ShellCommand(this.shellHelp,
                                  "help",
                                  "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;

            // shutdown
            sc = new ShellCommand(this.shellShutdown,
                                  "shutdown",
                                  "- Shuts down only the virtual OS.");
            this.commandList[this.commandList.length] = sc;

            // cls
            sc = new ShellCommand(this.shellCls,
                                  "cls",
                                  "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;

            // man <topic>
            sc = new ShellCommand(this.shellMan,
                                  "man",
                                  "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;

            // trace <on | off>
            sc = new ShellCommand(this.shellTrace,
                                  "trace",
                                  "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;

            // rot13 <string>
            sc = new ShellCommand(this.shellRot13,
                                  "rot13",
                                  "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;

            // prompt <string>
            sc = new ShellCommand(this.shellPrompt,
                                  "prompt",
                                  "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;

            // date
            sc = new ShellCommand(this.shellDate,
                                  "date",
                                  "- Displays the current date and time.");
            this.commandList[this.commandList.length] = sc;

            // whereami
            sc = new ShellCommand(this.shellWhereAmI,
                                  "whereami",
                                  "- Shows where the user currently is.");
            this.commandList[this.commandList.length] = sc;

            // piano
            sc = new ShellCommand(this.shellPiano,
                                  "piano",
                                  "- Your key presses now play piano notes!");
            this.commandList[this.commandList.length] = sc;

            // load
            sc = new ShellCommand(this.shellLoad,
                                  "load",
                                  "- Validates the user code in the HTML5 text area.");
            this.commandList[this.commandList.length] = sc;

            // seppuku
            sc = new ShellCommand(this.shellSeppuku,
                                  "seppuku",
                                  "- Commit seppuku (trigger the BSOD message)");
            this.commandList[this.commandList.length] = sc;

            // status
            sc = new ShellCommand(this.shellStatus,
                                  "status",
                                  "<string> - Changes the status message.");
            this.commandList[this.commandList.length] = sc;

            // run
            sc = new ShellCommand(this.shellRun,
                "run",
                "- Runs a program already in memory.");
            this.commandList[this.commandList.length] = sc;

            // run all
            sc = new ShellCommand(this.shellRunAll,
                                  "runall",
                                  "- Runs all programs in memory.");
            this.commandList[this.commandList.length] = sc;

            // ps  - list the running processes' IDs
            sc = new ShellCommand(this.shellPS,
                                  "ps",
                                  "- Lists all the running processes' IDs");
            this.commandList[this.commandList.length] = sc;

            // kill <id> - kills the specified process id.
            sc = new ShellCommand(this.shellKill,
                                  "kill",
                                  "<pid> - Kills a specified process id");
            this.commandList[this.commandList.length] = sc;

            // quantum <int> - sets the quantum for round robin scheduling
            sc = new ShellCommand(this.shellQuantum,
                                  "quantum",
                                  "<int> - Sets the quantum for round robin scheduling");
            this.commandList[this.commandList.length] = sc;

            // clearmem - clears all memory partitions
            sc = new ShellCommand(this.shellClearMem,
                                  "clearmem",
                                  "- Clears all memory partitions");
            this.commandList[this.commandList.length] = sc;

            // Display the initial prompt.
            this.putPrompt();
        }

        public putPrompt() {
            _StdOut.putText(this.promptStr);
        }

        public handleInput(buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match.  TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index: number = 0;
            var found: boolean = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                } else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses.
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {        // Check for apologies.
                    this.execute(this.shellApology);
                } else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }

        // Note: args is an option parameter, ergo the ? which allows TypeScript to understand that.
        public execute(fn, args?) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();
            // ... call the command function passing in the args with some über-cool functional programming ...
            fn(args);
            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }
            // ... and finally write the prompt again.
            this.putPrompt();
        }

        public parseInput(buffer): UserCommand {
            var retVal = new UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = Utils.trim(buffer);

            // 2. Lower-case it.
            buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript.  See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;

            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }

        //
        // Shell Command Functions.  Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        public shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }

        public shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }

        public shellApology() {
           if (_SarcasticMode) {
              _StdOut.putText("I think we can put our differences behind us.");
              _StdOut.advanceLine();
              _StdOut.putText("For science . . . You monster.");
              _SarcasticMode = false;
           } else {
              _StdOut.putText("For what?");
           }
        }

        public shellVer(args) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION + ". Creator: Kai Wong Fall 2017 Operating Systems");
        }

        public shellHelp(args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }

        public shellShutdown(args) {
             _StdOut.putText("Shutting down...");
             // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
        }

        public shellCls(args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        }

        public shellMan(args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        _StdOut.putText("Help displays a list of (hopefully) valid commands.");
                        break;
                    case "ver":
                        _StdOut.putText("Ver displays the name and the version of the operating system.");
                        break;
                    case "shutdown":
                        _StdOut.putText("Shutdown calls the kernel shutdown routine, shutting down the virtual OS but leaving the underlying host / hardware simulation running.");
                        break;
                    case "cls":
                        _StdOut.putText("Cls clears the screen by clearing the console rectangle and resets the XY position of the cursor.");
                        break;
                    case "man":
                        _StdOut.putText("Man takes a command as an argument and outputs what the command does. You should already know this, silly.");
                        break;
                    case "trace":
                        _StdOut.putText("Trace takes either yes or no as an argument, turning the OS' trace feature on or off.");
                        break;
                    case "rot13":
                        _StdOut.putText("Rot13 rotates each character in a string by 13 characters.");
                        break;
                    case "prompt":
                        _StdOut.putText("Prompt takes a string as an argument and sets the shell prompt to that string.");
                        break;
                    case "date":
                        _StdOut.putText("Date displays the current date and time.");
                        break;
                    case "whereami":
                        _StdOut.putText("Whereami displays your location in a friendly manner");
                        break;
                    case "piano":
                        _StdOut.putText("Piano plays a piano note for different key presses.");
                        break;
                    case "load":
                        _StdOut.putText("Load validates the user code in the HTML5 text area.");
                        break;
                    case "seppuku":
                        _StdOut.putText("Seppuku commits seppuku. Loads the BSOD message.");
                        break;
                    case "status":
                        _StdOut.putText("Status allows the user to change the status.");
                        break;
                    case "run":
                        _StdOut.putText("Run allows the user to run a program loaded into memory.");
                        break;
                    case "runall":
                        _StdOut.putText("Runs all the processes in memory.");
                        break;
                    case "ps":
                        _StdOut.putText("Lists all the active processes' PIDs");
                        break;
                    case "kill":
                        _StdOut.putText("Kills a specified process");
                        break;
                    case "quantum":
                        _StdOut.putText("Sets the quantum for round robin scheduling");
                        break;
                    case "clearmem":
                        _StdOut.putText("Clears all memory partitions");
                        break;
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            } else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        }

        public shellTrace(args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        } else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }
                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }

        public shellRot13(args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + Utils.rot13(args.join(' ')) +"'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }

        public shellPrompt(args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }

        public shellDate() {
            var dateTime = new Date().toLocaleString();
            _StdOut.putText("Current date and time: " + dateTime);
        }

        public shellWhereAmI() {
            _StdOut.putText("Open the window and look outside.");
        }

        public shellPiano() {
            if(!_PianoTime) _StdOut.putText("Your keyboard is now a piano!");
            else _StdOut.putText("Your keyboard is not a piano anymore.");
            _PianoTime = !_PianoTime;
        }

        // Validates by making sure the op codes are valid (hex, 2 long each)
        // Handles the case where the user enters newlines.
        // A user has to enter a program for load to return valid
        public shellLoad() {
            let re = /[0-9A-Fa-f]{2}/i;
            let foundError = false;
            let userInput = (<HTMLInputElement>document.getElementById("taProgramInput")).value;
            userInput = userInput.replace(/\r?\n|\r/g, " "); //removes newlines
            userInput = userInput.replace(/\s+/g, " ").trim(); //removes sequential spaces
            userInput = userInput.trim(); //remove leading and trailing spaces
            let userArr = userInput.split(" ");
            for(let opCode of userArr){
                if((opCode.length != 2 || !re.test(opCode))){
                    _StdOut.putText("Syntax error in user program!");
                    foundError = true;
                    break;
                }
            }
            if(!foundError){
                // Do a system call to create a new process
                 _ProcessManager.createProcess(userArr);
            }
        }

        public shellSeppuku() {
            // This simulates an interrupt that the kernel doesn't know how to handle
            // Execute order 66
            _KernelInterruptQueue.enqueue(66);
        }

        // This allows the user to change their status by setting the global user status variable to
        // whatever their input was
        public shellStatus(args) {
            if(args.length > 0) {
                _UserStatus = "";
                for(var word of args){
                    _UserStatus += word + " ";
                }
            }
            else{
                _StdOut.putText("Usage: status <message>  Please supply a message.");
            }
        }

        // Runs a program in memory
        // Clear memory after done
        public shellRun(args) {
            if(args.length == 1){
                // Find the process with the correct pid in the resident queue
                var foundPid = false;
                for(var i=0; i<_ProcessManager.residentQueue.getSize(); i++){
                    var pcb = _ProcessManager.residentQueue.dequeue();
                    if(pcb.Pid == args[0]){
                        // Now put that pid in the ready queue!!!
                        _ProcessManager.readyQueue.enqueue(pcb);
                        foundPid = true;
                    }
                    else{
                        // If it's not the poop chicken butt needed, put it back in resident queue
                        _ProcessManager.residentQueue.enqueue(pcb);
                    }
                }
                if(!foundPid){
                    _StdOut.putText("Usage: run <pid>  Please supply a valid process ID.");
                }
            }
            else{
                _StdOut.putText("Usage: run <pid>  Please supply a process ID.");
            }
        }

        // Runs all the programs in memory
        public shellRunAll() {
            _ProcessManager.runAll();
        }

        // Lists all the active processes' PIDs
        public shellPS() {
            let arr: Array<String> = _ProcessManager.listAll();
            _StdOut.putText("Active processes' PIDs: ");
            while(arr.length > 0){
                _StdOut.putText(arr.pop());
                if(arr.length != 0){
                    _StdOut.putText(", ");
                }
                else{
                    _StdOut.putText(".");
                }
            }
        }

        // Kills a specified process
        public shellKill(args) {
            if(args.length == 1){
                // Find the process with the correct pid in the ready queue
                var foundPid = _ProcessManager.exitAProcess(args[0]);
                if(!foundPid){
                    _StdOut.putText("Usage: kill <pid>  Please supply a valid process ID.");
                }
                else{
                    _StdOut.putText("Process " + args[0] + " successfully murdered. You horrible person.");
                }
            }
            else{
                _StdOut.putText("Usage: kill <pid>  Please supply a process ID.");
            }
        }

        // Sets the quantum for round robin scheduling
        public shellQuantum(args) {
            if(args.length == 1){
                var num = parseInt(args[0]);
                if(isNaN(num)){
                    _StdOut.putText("Usage: quantum <int>  Please supply a valid integer");
                }
                else{
                    if(typeof num === "number"){
                        _Scheduler.setQuantum(args[0]);
                        _StdOut.putText("Round robin quantum set to " + num);
                    }
                }
            }
            else{
                _StdOut.putText("Usage: quantum <int>  Please supply an integer")
            }
        }

        // Clears all memory partitions
        public shellClearMem() {
            _MemoryManager.clearAllMemory();
            _StdOut.putText("All memory partitions cleared!");
        }

    }
}
