///<reference path="../globals.ts" />
///<reference path="../os/canvastext.ts" />
/* ------------
     Control.ts

     Requires globals.ts.

     Routines for the hardware simulation, NOT for our client OS itself.
     These are static because we are never going to instantiate them, because they represent the hardware.
     In this manner, it's A LITTLE BIT like a hypervisor, in that the Document environment inside a browser
     is the "bare metal" (so to speak) for which we write code that hosts our client OS.
     But that analogy only goes so far, and the lines are blurred, because we are using TypeScript/JavaScript
     in both the host and client environments.

     This (and other host/simulation scripts) is the only place that we should see "web" code, such as
     DOM manipulation and event handling, and so on.  (Index.html is -- obviously -- the only place for markup.)

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */
//
// Control Services
//
var TSOS;
(function (TSOS) {
    var Control = /** @class */ (function () {
        function Control() {
        }
        Control.hostInit = function () {
            // This is called from index.html's onLoad event via the onDocumentLoad function pointer.
            // Get a global reference to the canvas.  TODO: Should we move this stuff into a Display Device Driver?
            _Canvas = document.getElementById('display');
            // Get a global reference to the drawing context.
            _DrawingContext = _Canvas.getContext("2d");
            // Enable the added-in canvas text functions (see canvastext.ts for provenance and details).
            TSOS.CanvasTextFunctions.enable(_DrawingContext); // Text functionality is now built in to the HTML5 canvas. But this is old-school, and fun, so we'll keep it.
            // Clear the log text box.
            // Use the TypeScript cast to HTMLInputElement
            document.getElementById("taHostLog").value = "";
            // Set focus on the start button.
            // Use the TypeScript cast to HTMLInputElement
            document.getElementById("btnStartOS").focus();
            // Check for our testing and enrichment core, which
            // may be referenced here (from index.html) as function Glados().
            if (typeof Glados === "function") {
                // function Glados() is here, so instantiate Her into
                // the global (and properly capitalized) _GLaDOS variable.
                _GLaDOS = new Glados();
                _GLaDOS.init();
            }
        };
        Control.hostLog = function (msg, source) {
            if (source === void 0) { source = "?"; }
            // Note the OS CLOCK.
            var clock = _OSclock;
            // Note the REAL clock in milliseconds since January 1, 1970.
            var now = new Date().getTime();
            // Build the log string.
            var str = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now + " })" + "\n";
            // Update the log console.
            var taLog = document.getElementById("taHostLog");
            taLog.value = str + taLog.value;
            //Updating the taskbar
            var dateTime = new Date().toLocaleString();
            document.getElementById("taskBar").innerHTML = "<h2>" + dateTime + " | " + _UserStatus + "</h2>";
            // TODO in the future: Optionally update a log database or some streaming service.
        };
        // This will update and display the CPU in real time
        Control.hostCPU = function () {
            var table = document.getElementById('tableCPU');
            table.deleteRow(-1);
            var row = table.insertRow(-1); // New row appended to table
            // PC
            var cell = row.insertCell();
            cell.innerHTML = _CPU.PC.toString();
            // IR
            var cell = row.insertCell();
            cell.innerHTML = _Memory.memoryArray[_CPU.PC].toString();
            // Acc
            cell = row.insertCell();
            cell.innerHTML = _CPU.Acc.toString(16).toUpperCase(); // convert to hex for display
            // Check to see if we need to have a leading zero...only numbers below 16 need a leading zero
            if (_CPU.Acc < 16) {
                cell.innerHTML = "0" + cell.innerHTML;
            }
            // Xreg
            cell = row.insertCell();
            cell.innerHTML = _CPU.Xreg.toString(16).toUpperCase(); // convert to hex for display
            // Check to see if we need to have a leading zero...only numbers below 16 need a leading zero
            if (_CPU.Xreg < 16) {
                cell.innerHTML = "0" + cell.innerHTML;
            }
            // Yreg
            cell = row.insertCell();
            cell.innerHTML = _CPU.Yreg.toString(16).toUpperCase(); // convert to hex for display
            // Check to see if we need to have a leading zero...only numbers below 16 need a leading zero
            if (_CPU.Yreg < 16) {
                cell.innerHTML = "0" + cell.innerHTML;
            }
            // Zflag
            cell = row.insertCell();
            cell.innerHTML = _CPU.Zflag.toString(16).toUpperCase(); // convert to hex for display
            // Check to see if we need to have a leading zero...only numbers below 16 need a leading zero
            if (_CPU.Zflag < 16) {
                cell.innerHTML = "0" + cell.innerHTML;
            }
        };
        // This will update and display the memory in real time
        Control.hostMemory = function () {
            var table = document.getElementById('tableMemory');
            var memoryPtr = 0;
            for (var i = 0; i < table.rows.length; i++) {
                for (var j = 1; j < 9; j++) {
                    table.rows[i].cells.item(j).innerHTML = _Memory.memoryArray[memoryPtr].toString();
                    memoryPtr++;
                }
            }
        };
        //
        // Host Events
        //
        Control.hostBtnStartOS_click = function (btn) {
            // Disable the (passed-in) start button...
            btn.disabled = true;
            // .. enable the Halt and Reset buttons ...
            document.getElementById("btnHaltOS").disabled = false;
            document.getElementById("btnReset").disabled = false;
            // .. set focus on the OS console display ...
            document.getElementById("display").focus();
            // ... Create and initialize the CPU (because it's part of the hardware)  ...
            _CPU = new TSOS.Cpu(); // Note: We could simulate multi-core systems by instantiating more than one instance of the CPU here.
            _CPU.init(); //       There's more to do, like dealing with scheduling and such, but this would be a start. Pretty cool.
            //Create and initialize the memory
            _Memory = new TSOS.Memory();
            _Memory.init();
            // ... then set the host clock pulse ...
            _hardwareClockID = setInterval(TSOS.Devices.hostClockPulse, CPU_CLOCK_INTERVAL);
            // .. and call the OS Kernel Bootstrap routine.
            _Kernel = new TSOS.Kernel();
            _Kernel.krnBootstrap(); // _GLaDOS.afterStartup() will get called in there, if configured.
        };
        Control.hostBtnHaltOS_click = function (btn) {
            Control.hostLog("Emergency halt", "host");
            Control.hostLog("Attempting Kernel shutdown.", "host");
            // Call the OS shutdown routine.
            _Kernel.krnShutdown();
            // Stop the interval that's simulating our clock pulse.
            clearInterval(_hardwareClockID);
            // TODO: Is there anything else we need to do here?
        };
        Control.hostBtnReset_click = function (btn) {
            // The easiest and most thorough way to do this is to reload (not refresh) the document.
            location.reload(true);
            // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
            // be reloaded from the server. If it is false or not specified the browser may reload the
            // page from its cache, which is not what we want.
        };
        return Control;
    }());
    TSOS.Control = Control;
})(TSOS || (TSOS = {}));
