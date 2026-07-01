import { setTtbProcess, ttbProcess } from "./sharedVars";


export const stopTranslucentTB = () => {
  try {
    if (ttbProcess) {
      ttbProcess.kill();
      setTtbProcess(null);
    }
  } catch (err) {
    console.error('Error stopping TranslucentTB:', err);
  }
};