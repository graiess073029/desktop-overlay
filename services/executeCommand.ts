import { exec, ExecException } from 'child_process';

export const executeCommand = (command : string) => {
    exec(command, { shell: "cmd" }, (error: ExecException | null, stdout, stderr) => {
        console.log("Executed command:", command);
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }
    });
}


