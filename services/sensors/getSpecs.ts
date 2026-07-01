import { execSync } from "child_process";
import os from "os";


function classifyGPU(name : string) : string {
  if (/intel|uhd|iris|xe/i.test(name)) return "iGPU";
  if (/nvidia|geforce|rtx|gtx/i.test(name)) return "dGPU";
  if (/amd|radeon/i.test(name)) return "dGPU";
  return "unknown";
}

export const getSpecs = () => {
    try {
        const cpu = os.cpus()[0].model;

        const rawgpus = execSync('powershell "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"')

        const parsedgpus : {[key : string] : string} = {};

        rawgpus.toString().split('\n').forEach((gpu) => {
            const type = classifyGPU(gpu);
            if (gpu.trim()) parsedgpus[type] = gpu;
        })

        const specs = {cpu, ...parsedgpus}

        return specs;
    } catch (err) {
        console.error('Error getting system specs:', err);
        throw err;
    }
}