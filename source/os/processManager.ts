/* ------------
   processManager.ts

   This is the client OS implementation of a process manager.
   This is responsible for keeping track of all the processes in the OS,
   as well as creating, saving, and exiting them.
   PROJECT 2: NOT UPDATING PCB BECAUSE WE NEVER DO A CONTEXT SWITCH.
   ------------ */

   module TSOS {
    export class ProcessManager {
        public residentQueue: any;
        public readyQueue: any;
        public running: TSOS.ProcessControlBlock;
        constructor() {     // Keeps track of running PCB
            this.residentQueue = new Queue();                       // Where we load the program into memory, where it waits to be run.
            this.readyQueue = new Queue();                          // Where a program is put when marked for CPU to move its program counter forward.
        }

        public createProcess(opcodes, args): void {
            // Check to see if there is an available partition in memory to put program in.
            // Make sure the program can fit into that partition
            // First, make sure the opcodes are under 256 bytes in length.
            if(opcodes.length > _MemoryManager.globalLimit){
                _StdOut.putText("Loading of program failed! Program is over 256 bytes in length.");
                return;
            }
            // If there is no available memory, then display appropriate output to the user.
            if(_MemoryManager.checkMemory(opcodes.length)){
                let pcb = new ProcessControlBlock(_Pid);
                // Have the memory manager load the new program into memory.
                // We have to get an available partition in memory and load the program into there.
                var partition = _MemoryManager.getFreePartition(opcodes.length);
                pcb.init(partition);
                // Assign priority if given
                if(args.length > 0){
                    pcb.Priority = parseInt(args[0]);
                }
                else{
                    pcb.Priority = 1;
                }
                // Put the new PCB onto the resident queue where it waits for CPU time
                this.residentQueue.enqueue(pcb);
                _MemoryManager.loadIntoMemory(opcodes, partition);
                // Update the display accordingly
                Control.hostMemory();
                _StdOut.putText("Program loaded in memory with process ID " + _Pid);
                _Pid++;
            }
            // If there is no more memory, then go find free space in the disk
            // Call the swapper to perform swapping operations
            else{
                // We also have to make sure the program is not too large. A program is limited by the partition size.
                // Returns the TSB of the process in disk
                let tsb = _Swapper.putProcessToDisk(opcodes);
                // See if there is space on the disk for the process
                if(tsb != null){
                    // There is space on the disk for the process, so create a new PCB
                    let pcb = new ProcessControlBlock(_Pid);
                    pcb.init(IN_DISK);
                    // Assign priority if given
                    if(args.length > 0){
                        pcb.Priority = args[0];
                    }
                    else{
                        pcb.Priority = 1;
                    }
                    // Set the PCB's TSB for the TSB it is stored in
                    pcb.Swapped = true;
                    pcb.TSB = tsb;
                    pcb.State = "Swapped";
                    // Put the new PCB onto the resident queue where it waits for CPU time
                    this.residentQueue.enqueue(pcb);
                    _StdOut.putText("Program loaded in memory with process ID " + _Pid);
                    _Pid++;
                }
                else{
                    _StdOut.putText("Loading of program failed! Not memory available.");
                }
            }
        }

        // This exits a process from the CPU. Let's just call CPU.init() to reset it, which will
        // set isExecuting to false and all registers to 0.
        // We also need to reset the memory partition the process was running in. Look in PCB to see which partition to reset
        // We also need to remove the process from the ready queue display
        // We also need to update the CPU and memory display
        // Display stats depending on whether true or false is passed in
        public exitProcess(displayStats: boolean): void {
            _CPU.init();
            _MemoryManager.clearMemoryPartition(this.running.Partition);
            Control.hostMemory();
            // Update host log
            Control.hostLog("Exiting process " + this.running.Pid, "os");
            if(displayStats){
                // Print out the wait time and turnaround time for that process
                _StdOut.advanceLine();
                _StdOut.putText("Process ID: " + this.running.Pid);
                _StdOut.advanceLine();
                _StdOut.putText("Turnaround time: " + this.running.turnAroundTime + " cycles.");
                _StdOut.advanceLine();
                _StdOut.putText("Wait time: " + this.running.waitTime + " cycles.");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
            }
            // Clear out running process
            this.running = null;
            // // Update processes display
            // Control.hostProcesses();
            // Reset the scheduler's counter
            _Scheduler.unwatch();
        }

        // This exits a process from the ready queue.
        // Removes it from the ready queue and clears the appropriate memory partition
        public exitAProcess(pid): boolean {
            var theChosenPcb;
            for(var i=0; i<this.readyQueue.getSize(); i++){
                var pcb = this.readyQueue.dequeue();
                if(pcb.Pid == pid){
                    // The chosen one
                    theChosenPcb = pcb;
                    // If it is swapped out to disk, remove it from disk as well.
                    if(theChosenPcb.Swapped){
                        console.log("EXITED A PROCESS THAT IS IN THE READY QUEUE BUT IS SWAPPED OUT");
                        Control.hostLog("Exiting process " + pid, "os");
                        _krnDiskDriver.krnDiskDeleteData(theChosenPcb.TSB);
                        return true;
                    }
                }
                else{
                    // If it's not the poop chicken butt needed, put it back in the ready queue
                    this.readyQueue.enqueue(pcb);
                }
            }
            // Check the running PCB to see if it has the correct pid
            if(this.running != null){
                if(this.running.Pid == pid){
                    theChosenPcb = this.running;
                    // Slaughter it by calling exit process
                    _KernelInterruptQueue.enqueue(new Interrupt(PROCESS_EXIT, false));
                }
            }
            if(theChosenPcb == null){
                return false;
            }
            else{
                // Update host log
                Control.hostLog("Exiting process " + pid, "os");
                _MemoryManager.clearMemoryPartition(theChosenPcb.Partition);
                // // Update processes display
                // Control.hostProcesses();
                return true;
            }
        }

        // On each clock pulse, check to see if there is anything in the ready queue.
        // If so, make the CPU run user process.
        public checkReadyQueue(): void {
            if(!this.readyQueue.isEmpty()){
                this.runProcess();
            }
            else{
                _CPU.isExecuting = false;
            }
        }
        
        // This runs a process that is stored in memory
        public runProcess(): void {
            // Call the scheduler to reorder the ready queue if the scheduling scheme is Priority
            if(_Scheduler.algorithm == PRIORITY){
                this.running = _Scheduler.findHighestPriority();
            }
            else{
                // Take a PCB off the ready queue, and set the CPU to its info.
                // Starts the CPU executing by setting isExecuting to true.
                this.running = this.readyQueue.dequeue();
            }
            // Put all stuff from PCB to CPU
            _CPU.PC = this.running.PC;
            _CPU.Acc = this.running.Acc;
            _CPU.Xreg = this.running.Xreg;
            _CPU.Yreg = this.running.Yreg;
            _CPU.Zflag = this.running.Zflag;
            _CPU.isExecuting = true;
            // We need to check if the process is stored in disk. If so, we need to have the swapper roll in from disk, and 
            // roll out a process in memory if there is not enough space in memory for the rolled-in process.
            if(this.running.Swapped){
                // Roll it in from disk
                _Swapper.rollIn(this.running);
                // No longer swapped out to disk
                this.running.Swapped = false;
                this.running.TSB = "0:0:0";
            }
            // Set the PCB status to running
            this.running.State = "Running";
            // // Update the display for the PCB
            // Control.hostProcesses();
            // Update the CPU display as well
            Control.hostCPU();
            // Update the memory as well
            Control.hostMemory();
            // Update host log
            Control.hostLog("Running process " + this.running.Pid, "os");
        }

        // This checks if a process is running
        public isRunning(): boolean {
            return this.running != null;
        }

        // This runs all the programs in memory by moving all the PCBs
        // in the resident queue to the ready queue
        public runAll(): void {
            Control.hostLog("Running all programs", "os");
            while(!this.residentQueue.isEmpty()){
                this.readyQueue.enqueue(this.residentQueue.dequeue());
            }
        }

        // Returns a list of all processes by returning array of
        // the ids of PCBs in ready queue and the running PCB
        public listAll(): Array<String> {
            if(this.running != null){
                let result: Array<String> = [];
                result.push(new String(this.running.Pid));
                for(var i=0; i<this.readyQueue.getSize(); i++){
                    var pcb = this.readyQueue.dequeue();
                    result.push(new String(pcb.Pid));
                    this.readyQueue.enqueue(pcb);
                }
                // while(readyQueue.length > 0){
                //     result.push(new String(readyQueue.pop().Pid));
                // }
                return result;
            }
            else{
                return [];
            }
        }

        // Updates the PCB when performing a context switch
        // Simply saves the CPU information into the running PCB
        public updatePCB(): void {
            this.running.PC = _CPU.PC;
            this.running.Acc = _CPU.Acc;
            this.running.Xreg = _CPU.Xreg; 
            this.running.Yreg = _CPU.Yreg;
            this.running.Zflag = _CPU.Zflag;
            this.running.State = "Waiting";
            this.running.IR = _MemoryAccessor.readMemory(_CPU.PC).toUpperCase();
        }

        // Update turnaround times and wait times for all processes
        public processStats(): void {
            // Increment the turnaround times for all processes
            // Increment the wait times for all processes in the ready queue
            this.running.turnAroundTime++;
            for(var i=0; i<this.readyQueue.getSize(); i++){
                var pcb = this.readyQueue.dequeue();
                pcb.turnAroundTime++;
                pcb.waitTime++;
                this.readyQueue.enqueue(pcb);
            }
        }
    }
}
