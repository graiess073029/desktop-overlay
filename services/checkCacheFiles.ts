import { app } from "electron";
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import { readDesktop } from "./apps/addApp";
import { addDefaultBackground } from "./backgrounds/addBackground";
import { fileExists } from "./exposeDataPath";


export const verifyDataFiles = async () => {
  const userDataPath = app.getPath('userData');
  const dataFolder = path.join(userDataPath, 'data');

  if (!(await fileExists(dataFolder))) {
    await mkdir(dataFolder, { recursive: true });
  }

  const ensureFile = async (filePath: string, content: string) => {
    if (!(await fileExists(filePath))) {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, content);
    }
  };

  const ensureDir = async (dirPath: string) => {
    try {
      await access(dirPath);
    } catch {
      await mkdir(dirPath, { recursive: true });
    }
  };

  await ensureDir(path.join(dataFolder, 'assets', 'backgrounds'));
  await ensureDir(path.join(dataFolder, 'assets', 'backgrounds', 'animated'));
  await ensureDir(path.join(dataFolder, 'assets', 'backgrounds', 'posters'));
  await ensureDir(path.join(dataFolder, 'assets', 'backgrounds', "static"));
  await ensureFile(path.join(dataFolder, 'backgrounds.JSON'), JSON.stringify([]));
  await addDefaultBackground();

  await ensureDir(path.join(dataFolder, 'assets', 'images'));
  await ensureDir(path.join(dataFolder, 'assets', 'images', 'appsIcons'));

  await ensureFile(path.join(dataFolder, 'data.csv'), '');
  await ensureFile(path.join(dataFolder, 'sensorMapping.json'), JSON.stringify({}));



  if (!(await fileExists(path.join(dataFolder, 'data.JSON')))) {
    await writeFile(path.join(dataFolder, 'data.JSON'), "{}");
    await readDesktop();
  }

};