import { loadCachedSensorMapping, mapSensorsWithAI } from "./sensorMapper";
import { getDataSample } from "./sharedMemReader";


export const checkSensorMapping = async (): Promise<void> => {
  try {
    let mapping = await loadCachedSensorMapping();
    if (mapping && Object.keys(mapping).length > 0) {
      console.log("Loaded sensor mapping from cache.");
      return;
    }

    console.log("No cached sensor mapping found. Starting AI mapping process...");
    setTimeout(async () => {
      try {
        const dataSample = getDataSample();
        if (!dataSample) {
          console.log("No data sample available for mapping");
          return;
        }

        await mapSensorsWithAI(dataSample);
        console.log("Sensor mapping completed and cached.");
      } catch (err) {
        console.error("Error in sensor mapping timeout handler:", err);
      }
    }, 1000)
  }
  catch (err) {
    console.error("Error during sensor mapping check:", err);
  }
}