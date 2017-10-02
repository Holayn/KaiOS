///<reference path="../globals.ts" />
///<reference path="queue.ts" />

/* ------------
     Kernel.ts

     Requires globals.ts
              queue.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Kernel {
        //
        // OS Startup and Shutdown Routines
        //
        public krnBootstrap() {      // Page 8. {
            Control.hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

            // Initialize our global queues.
            _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array();         // Buffers... for the kernel.
            _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.
            _ResidentQueue = new Queue();         // Where we load the program into memory, where it waits to be run.
            _ReadyQueue = new Queue();            // Where a program is put when marked for CPU to move its program counter forward.

            // Initialize the console.
            _Console = new Console();          // The command line interface / console I/O device.
            _Console.init();

            // Initialize standard input and output to the _Console.
            _StdIn  = _Console;
            _StdOut = _Console;

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
            _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

            //
            // ... more?
            //

            // Yeah, there's more. Load the memory manager.
            _MemoryManager = new MemoryManager();

            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();

            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new Shell();
            _OsShell.init();

            // Finally, initiate student testing protocol.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        }

        public krnShutdown() {
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the Interrupts.
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();
            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace("end shutdown OS");
        }


        public krnOnCPUClockPulse() {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
               This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
               This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
               that it has to look for interrupts and process them if it finds any.                           */
            
            // Check for an interrupt, are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // Process the first interrupt on the interrupt queue.
                // TODO: Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            } else if (_CPU.isExecuting) { // If there are no interrupts then run one CPU cycle if there is anything being processed. {
                _CPU.cycle();
            } else {                      // If there are no interrupts and there is nothing being executed then just be idle. {
                this.krnTrace("Idle");
                // On each clock pulse, check to see if there is anything in the ready queue.
                // If so, make the CPU run user process by setting isExecuting to true
                if(!_ReadyQueue.isEmpty()){
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
                    _Running = _ReadyQueue.dequeue();
                    // Put all stuff from PCB to CPU
                    _CPU.PC = _Running.PC;
                    _CPU.Acc = _Running.Acc;
                    _CPU.Xreg = _Running.Xreg;
                    _CPU.Yreg = _Running.Yreg;
                    _CPU.Zflag = _Running.Zflag;
                    _CPU.isExecuting = true;
                }
                else{
                    _CPU.isExecuting = false;
                }
            }
            // Read CPU stuff, store back into PCB
        }


        //
        // Interrupt Handling
        //
        public krnEnableInterrupts() {
            // Keyboard
            Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }

        public krnDisableInterrupts() {
            // Keyboard
            Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }

        public krnInterruptHandler(irq, params) {
            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);

            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR();              // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params);   // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
                    _StdOut.putText("RIP IN POTATOES UR OPERATING SYSTEM IS DED L0L");
            }
        }

        public krnTimerISR() {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
        }

        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile

        // Creates a process by creating a PCB for the program, loading the program into memory, and putting the PCB onto the resident queue.
        public krnCreateProcess(opcodes){
            // Check to see if there is an available partition in memory to put program in.
            // If there is no available memory, then let the shell know so it can display appropriate output to the user.
            if(_MemoryManager.checkMemory()){
                //Assign a PID. Create a new PCB for it, and put it in the job/resident queue.
                let pcb = new ProcessControlBlock(_Pid);
                // Get base limit register from memory manager
                var base = _MemoryManager.getBaseRegister();
                var limit = _MemoryManager.getLimitRegister();
                pcb.init(base, limit);
                _ResidentQueue.enqueue(pcb);
                // Have the memory manager load the new process into memory
                _MemoryManager.loadIntoMemory(opcodes);
                _Pid++;
                return pcb.Pid;
            }
            else{
                return -1;
            }
            
        }

        // This stops the CPU from executing whatever it is executing. Let's just call CPU.init() to reset it, which will
        // set isExecuting to false.
        // We also need to reset the memory partition the process was running in. Look in PCB to see which partition to reset
        public krnExitProcess(){
            _MemoryManager.clearMemoryPartition(_Running);
            _CPU.init();
        }

        // This system call prints the CPU's Y register
        public krnPrintYReg(){
            _StdIn.putText(_CPU.Yreg);
        }
        
        // This system call prints the 00-terminated string stored at the address in the Y register
        public krnPrintYRegString(){
            var address = _CPU.Yreg;
            var string = "";
            // Gets the ASCII from the address, converts it to characters, then passes to console's putText.
            while(_Memory.memoryArray[address] != "00"){
                var value = _Memory.memoryArray[address];
                var chr = String.fromCharCode(value);
                string += chr;
            }
            _StdIn.putText(string);
        }

        //
        // OS Utility Routines
        //
        public krnTrace(msg: string) {
             // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
             if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would lag the browser very quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        Control.hostLog(msg, "OS");
                    }
                } else {
                    Control.hostLog(msg, "OS");
                }
             }
        }

        public krnTrapError(msg) {
            Control.hostLog("OS ERROR - TRAP: " + msg);
            // TODO: Display error on console, perhaps in some sort of colored screen. (Maybe blue?)
            this.krnShutdown();
        }
    }
}
