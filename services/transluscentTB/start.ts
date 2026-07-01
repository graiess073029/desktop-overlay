import { ChildProcess, spawn } from "child_process";
//@ts-ignore
import { findTranslucentTB } from "./find";
import { ttbProcess, ttbPath, setTTbPath, setTtbProcess } from "./sharedVars";


export const startTranslucentTB = async (args: string[] = []) => {
  try {
    if (ttbProcess) return;

    const foundPath = await findTranslucentTB();
    setTTbPath(foundPath);
    
    if (!foundPath) {
      console.warn('TranslucentTB not found. Taskbar transparency disabled.');
      return;
    }

    console.log(`Starting TranslucentTB from: ${foundPath}`);
    const process = spawn(foundPath, args, { detached: false, windowsHide: true });
    setTtbProcess(process);

    (process as unknown as ChildProcess).on('exit', (code) => {
      console.log(`TranslucentTB exited with code ${code}`);
      setTtbProcess(null);
    });

    (process as unknown as ChildProcess).on('error', (err) => {
      console.error('TranslucentTB failed to start:', err);
      setTtbProcess(null);
    });
  } catch (err) {
    console.error('Error starting TranslucentTB:', err);
  }
};