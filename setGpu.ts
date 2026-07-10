
import { execSync } from 'child_process';
import { app } from 'electron';

export const setGpuPreference = () => {
  try {
    const exePath = app.isPackaged ? process.execPath : process.argv[0];
    const regPath = 'HKCU:\\\\Software\\\\Microsoft\\\\DirectX\\\\UserGpuPreferences';
    
    // Ensure registry key exists
    try {
      execSync(`powershell -Command "New-Item -Path '${regPath}' -Force | Out-Null"`, 
        { windowsHide: true, stdio: 'pipe' });
    } catch { /* already exists */ }
    
    // Set GPU preference to Power Saving (iGPU = 1)
    // 0 = Auto, 1 = Power Saving (iGPU), 2 = High Performance (dGPU)
    execSync(
      `powershell -Command "Set-ItemProperty -Path '${regPath}' -Name '${exePath}' -Value 'GpuPreference=1;'"`,
      { windowsHide: true, stdio: 'pipe' }
    );
    
    console.log('[GPU] Set preference to iGPU for:', exePath);
  } catch (err) {
    console.error('[GPU] Failed to set GPU preference:', err);
  }
};

