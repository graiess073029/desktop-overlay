import path from "path";
import { fileExists } from "../exposeDataPath";

export const findHWiNFO64 = async (): Promise<string | null> => {

  // 2. Fallback to system installs
  const commonPaths = [
    path.join(process.env.PROGRAMFILES || '', 'HWiNFO64', 'HWiNFO64.EXE'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'HWiNFO64', 'HWiNFO64.EXE'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'HWiNFO64', 'HWiNFO64.EXE'),
    path.join('C:', 'Program Files', 'HWiNFO64', 'HWiNFO64.EXE'),
    path.join('C:', 'Program Files (x86)', 'HWiNFO64', 'HWiNFO64.EXE'),
    // HWiNFO est souvent installé dans un dossier sans version
    path.join(process.env.PROGRAMFILES || '', 'HWiNFO', 'HWiNFO64.EXE'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'HWiNFO', 'HWiNFO64.EXE'),
    // Portable / custom locations
    path.join('C:', 'HWiNFO64', 'HWiNFO64.EXE'),
    path.join('C:', 'Tools', 'HWiNFO64', 'HWiNFO64.EXE'),

    path.join(process.env.PROGRAMFILES || '', 'HWiNFO32', 'HWiNFO32.EXE'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'HWiNFO32', 'HWiNFO32.EXE'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'HWiNFO32', 'HWiNFO32.EXE'),
    path.join('C:', 'Program Files', 'HWiNFO32', 'HWiNFO32.EXE'),
    path.join('C:', 'Program Files (x86)', 'HWiNFO32', 'HWiNFO32.EXE'),
    // HWiNFO est souvent installé dans un dossier sans version
    path.join(process.env.PROGRAMFILES || '', 'HWiNFO', 'HWiNFO32.EXE'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'HWiNFO', 'HWiNFO32.EXE'),
    // Portable / custom locations
    path.join('C:', 'HWiNFO32', 'HWiNFO32.EXE'),
    path.join('C:', 'Tools', 'HWiNFO32', 'HWiNFO32.EXE'),
  ];

  for (const p of commonPaths) {
    if (await fileExists(p)) return p;
  }

  // 3. Last resort: PATH lookup + where
  try {
    const { execSync } = require('child_process');
    const result = execSync('where HWiNFO64.EXE', { encoding: 'utf-8', stdio: 'pipe' });
    return result.trim().split('\n')[0].trim();
  } catch {
    // ignore
  }

  // 4. Try with different casing (HWiNFO64.exe vs HWiNFO64.EXE)
  try {
    const { execSync } = require('child_process');
    const result = execSync('where HWiNFO64.exe', { encoding: 'utf-8', stdio: 'pipe' });
    return result.trim().split('\n')[0].trim();
  } catch {
    return null;
  }
};