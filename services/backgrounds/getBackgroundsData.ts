import path from 'path';
import { dataFolder } from '../exposeDataPath';
import { readFile } from 'fs/promises';


export const bgDataPath = path.join(dataFolder,"backgrounds.json");
export const bgDataFolder = path.join(dataFolder,"assets","backgrounds");

export const getBackgroundsData = async () => {
    try {
        const fileContent = await readFile(bgDataPath, 'utf-8');
        const bgData = JSON.parse(fileContent);
        return bgData;
    } catch (err) {
        console.error('Failed to read or parse backgrounds data from', bgDataPath, err);
        throw new Error(`Failed to load backgrounds data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
}


