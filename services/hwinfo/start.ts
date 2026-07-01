import { exec } from "child_process";
import { findHWiNFO64 } from "./find";

export const startHWiNFO = async () => {
  try {
    const hwinfoPath = await findHWiNFO64();
    if (!hwinfoPath) {
      console.warn('HWiNFO64 not found');
      return;
    }

    console.log(`Starting HWiNFO from: ${hwinfoPath}`);
    
    exec(`start /min "" "${hwinfoPath}"`, { windowsHide: true }, (err) => {
      if (err) {
        console.error('HWiNFO start error:', err);
      }
    });
  } catch (err) {
    console.error('Error starting HWiNFO:', err);
    throw err;
  }
};