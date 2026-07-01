import path from "path";
import { getAddonPath, fileExists } from "../exposeDataPath";

export const findTranslucentTB = async (): Promise<string | null> => {
  // 1. Check bundled addon path (works in dev + packaged)
  const bundled = getAddonPath('TranslucentTB.exe');
  if (await fileExists(bundled)) return bundled;

  // 2. Fallback to system installs
  const commonPaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'TranslucentTB.exe'),
    path.join(process.env.PROGRAMFILES || '', 'TranslucentTB', 'TranslucentTB.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'TranslucentTB', 'TranslucentTB.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'TranslucentTB', 'TranslucentTB.exe'),
  ];

  for (const p of commonPaths) {
    if (await fileExists(p)) return p;
  }

  // 3. Last resort: PATH lookup
  try {
    const { execSync } = require('child_process');
    const result = execSync('where TranslucentTB.exe', { encoding: 'utf-8', stdio: 'pipe' });
    return result.trim().split('\n')[0].trim();
  } catch {
    return null;
  }
};