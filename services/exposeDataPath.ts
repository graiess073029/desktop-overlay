import { app } from "electron";
import { existsSync } from "fs";
import { access } from "fs/promises";
import path from "path";

export const userDataPath = app.getPath('userData');
export const dataFolder = path.join(userDataPath, 'data');


export const getAddonPath = (...segments: string[]): string => {
  if (app.isPackaged) {

    const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'addon', ...segments);
    if (existsSync(unpackedPath)) return unpackedPath;
    
    const distPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'addon', ...segments);
    if (existsSync(distPath)) return distPath;
  }
  
  // Dev: addon/ à la racine du projet
  return path.resolve(process.cwd(), 'addon', ...segments);
};

export const getAssetPath = (...segments: string[]): string => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', ...segments);
  }
  return path.resolve(process.cwd(), ...segments);
};


export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};