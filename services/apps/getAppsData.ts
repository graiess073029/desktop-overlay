import path from "path";
import { dataFolder } from "../exposeDataPath";
import { readFile } from "fs/promises";
import { AppsData } from "../../types";
const appsDataPath = path.join(dataFolder,"data.json");

export const getAppsData = async() : Promise<AppsData> => {
    try {
        const fileContent = await readFile(appsDataPath, 'utf-8');
        const appsData = JSON.parse(fileContent) as AppsData;
        return appsData;
    } catch (err) {
        console.error('Failed to read or parse apps data from', appsDataPath, err);
        throw new Error(`Failed to load apps data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
}


