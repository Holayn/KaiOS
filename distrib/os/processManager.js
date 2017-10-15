/* ------------
   processManager.ts

   This is the client OS implementation of a process manager.
   This is responsible for keeping track of all the processes in the OS,
   as well as creating, saving, and exiting them.
   ------------ */
var TSOS;
(function (TSOS) {
    var ProcessManager = /** @class */ (function () {
        function ProcessManager(residentQueue, readyQueue, running) {
            this.residentQueue = residentQueue;
            this.readyQueue = readyQueue;
            this.running = running;
            this.residentQueue = new TSOS.Queue(); // Where we load the program into memory, where it waits to be run.
            this.readyQueue = new TSOS.Queue(); // Where a program is put when marked for CPU to move its program counter forward.
        }
        ProcessManager.prototype.createProcess = function (opcodes) {
            // Check to see if there is an available partition in memory to put program in.
            // If there is no available memory, then let the shell know so it can display appropriate output to the user.
            if (_MemoryManager.checkMemory()) {
                var pcb = new TSOS.ProcessControlBlock(_Pid);
                // Have the memory manager load the new program into memory
                // We have to get an available partition in memory and load the program into there
                var partition = _MemoryManager.getFreePartition();
                pcb.init(partition);
                // Put the new PCB onto the resident queue where it waits for CPU time
                this.residentQueue.enqueue(pcb);
                _MemoryManager.loadIntoMemory(opcodes, partition);
                _StdOut.putText("Program loaded in memory with process ID " + _Pid);
                _Pid++;
            }
            else {
                _StdOut.putText("Loading of program failed!");
            }
        };
        // This stops the CPU from executing whatever it is executing. Let's just call CPU.init() to reset it, which will
        // set isExecuting to false.
        // We also need to reset the memory partition the process was running in. Look in PCB to see which partition to reset
        // We also need to remove the process from the ready queue display
        // We also need to update the CPU and memory display
        ProcessManager.prototype.exitProcess = function () {
            _MemoryManager.clearMemoryPartition(this.running.Partition);
            _CPU.init();
            this.running = null;
            TSOS.Control.hostProcesses();
            TSOS.Control.hostCPU();
            TSOS.Control.hostMemory();
        };
        // On each clock pulse, check to see if there is anything in the ready queue.
        // If so, make the CPU run user process by setting isExecuting to true
        ProcessManager.prototype.checkReadyQueue = function () {
            if (!this.readyQueue.isEmpty()) {
                this.runProcess();
            }
            else {
                _CPU.isExecuting = false;
            }
        };
        // This runs a process that is stored in memory
        ProcessManager.prototype.runProcess = function () {
            // Set CPU's stuff to PCB's stored info. We need a way to keep track what is running. 
            // How to tell CPU is not executing anymore? Break opcode
            // Ok, so dequeue from the ready queue. This ready queue will later be reordered by scheduler.
            // You'll get a PCB.
            // Start executing the op codes based on its program counter.
            // One op code at a time.
            // For now, if there is currently a process being executed, let it run
            // to its full completion.
            // Need to keep track somehow if process currently executing. If program counter 0, no process running. NOPE.
            // Also, how do we update PCB info?
            this.running = this.readyQueue.dequeue();
            // Put all stuff from PCB to CPU
            _CPU.PC = this.running.PC;
            _CPU.Acc = this.running.Acc;
            _CPU.Xreg = this.running.Xreg;
            _CPU.Yreg = this.running.Yreg;
            _CPU.Zflag = this.running.Zflag;
            _CPU.isExecuting = true;
            // Set the PCB status to running
            this.running.State = "Running";
            // Update the display for the PCB
            TSOS.Control.hostProcesses();
            // Update the CPU display as well
            TSOS.Control.hostCPU();
            // Update the memory as well
            TSOS.Control.hostMemory();
        };
        return ProcessManager;
    }());
    TSOS.ProcessManager = ProcessManager;
})(TSOS || (TSOS = {}));
