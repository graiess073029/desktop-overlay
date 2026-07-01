import { join } from "path";
import { dataFolder } from "../exposeDataPath";
import { getAppsData } from "./getAppsData";
import {  AppsData } from "../../types";
import fs from "fs/promises";


export const deleteApp = async (paths: string[]) => {
  try {
    const apps = await getAppsData();

    const updatedApps: AppsData = Object.fromEntries(
      Object.entries(apps).filter(
        ([_, app]) => { return !paths.includes(app.process)}
      )
    );

    await fs.writeFile(
      join(dataFolder, "data.json"),
      JSON.stringify(updatedApps, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error('Error deleting app:', err);
    throw err;
  }
};