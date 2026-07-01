import { HWiNFOSnapshot } from "hwinfo-reader";
import { access, readFile, writeFile } from "fs/promises";
import { SensorCandidate, LabelMapping, GeminiResponse, ServerResponse } from "../../types.js";
import { dataFolder } from "../exposeDataPath.js";
import path from "path";
import { BrowserWindow } from "electron";

// ============================================================================
// EXTRACTION DES CANDIDATS (pour le prompt LLM)
// ============================================================================

export const extractCandidates = (rawData: HWiNFOSnapshot): SensorCandidate[] => {
  return rawData.sensors.flatMap((sensor) =>
    sensor.readings.map((reading) => ({
      index: reading.index,
      label: reading.labelOriginal,
      unit: reading.unit,
      type: reading.readingType,
      group: sensor.nameOriginal,
      sensorId: sensor.sensorId,
    }))
  );
};

export let sensorMappingRAMCache: LabelMapping | null = null;


export const cacheSensorMapping = async (mapping: LabelMapping) => {
  const filePath = path.join(dataFolder, "sensorMapping.json");
  await writeFile(filePath, JSON.stringify(mapping, null, 2));
  sensorMappingRAMCache = mapping;
};

export const loadCachedSensorMapping = async (): Promise<LabelMapping | null> => {
  try {
    const filePath = path.join(dataFolder, "sensorMapping.json");
    await access(filePath);
    const raw = await readFile(filePath, "utf-8");
    if (raw === "{}") return null;
    sensorMappingRAMCache = JSON.parse(raw) as LabelMapping;
    return sensorMappingRAMCache;
  } catch (err) {
    console.error(err)
    return null;
  }
}

export const mapSensorsWithAI = async (
  rawData: HWiNFOSnapshot,
): Promise<LabelMapping | null> => {
  try {
    BrowserWindow.getAllWindows().forEach(async (win) => {
      try {
        win.webContents.send("mapping-start");
      } catch (err) {
        console.error("Error sending mapping-start event:", err);
      }
    });

    console.log("Mapping sensors with AI...");

    const candidates = extractCandidates(rawData);

    const response = await fetch(
      "https://gemini-bridge-du1y.onrender.com/mapSensors",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ candidates, secretKey: "K8vT2pQm9XcL4rN7sD6hJ1zA5" }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error. Status Code : ${response.status} \n ${await response.text()}`);
    }

    const parsedResponse: ServerResponse = await response.json() as ServerResponse;

    let labelMapping: LabelMapping = parsedResponse.data;

    console.log("Mapping sensors with AI completed.");

    await cacheSensorMapping(labelMapping);

        BrowserWindow.getAllWindows().forEach(async (win) => {
      try {
        win.webContents.send("mapping-finished");
      } catch (err) {
        console.error("Error sending mapping-finished event:", err);
      }
    });

    return labelMapping;
  }

  catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error during sensor mapping';
    console.error('Error in mapSensorsWithAI:', errorMsg);
    BrowserWindow.getAllWindows().forEach(async (win) => {
      try {
        win.webContents.send("mapping-error");
      } catch (sendErr) {
        console.error("Error sending mapping-error event:", sendErr);
      }
    });
    return null;
  }
};

