
import { injectApps } from "../../shared/appsInjection.js";
import { InitializeBackground } from "../../shared/dataFetchers/backgroundsFetch.js";
import { fetchSensorsMap } from "../../shared/dataFetchers/sensorsMapFetcher.js";
import { addAppsHandlers } from "./handlers/appsHandlers.js";
import { BgData, LabelMapping, ModeObject, SensorsData } from "../../shared/types.js";
import { specsFetch } from "../../shared/dataFetchers/specsFetch.js";
import { DOMElements } from "../../shared/elements.js";
import { setCoresStructure, setFansStructure, setGpuStructure } from "../../shared/sensors/setStructure.js";
import { updateUi } from "../../shared/sensors/updateUi.js";
import { setMode } from "./handlers/modesHandlers.js";
import { initSettings } from "./initSettings.js";
import { addSettingsHandlers, mappingSensors } from "../../shared/handlers/settingsHandlers.js";





const init = async () => {
  try {
    ;
    await InitializeBackground();
    addAppsHandlers();
    addSettingsHandlers();
    injectApps();
    initSettings()
    let specs = await specsFetch();
    DOMElements.cpuName.textContent = specs.cpu; 
    await fetchSensorsMap().then((sensorsMap : LabelMapping) => {  
      setCoresStructure(sensorsMap.cpu.cores.length);
      setFansStructure(sensorsMap);
      setGpuStructure(sensorsMap,specs)
    });
    const mode = (window.localStorage.getItem("mode") || "normal") as keyof ModeObject;
    setMode(mode);
    let lastUpdate : Date = new Date();
    window.api.onDiagnosticUpdate(async (data : SensorsData) => {
      lastUpdate = new Date();
      if(data && !mappingSensors) await updateUi(data)
    })

    setInterval(() => {
      if(new Date().getTime() - lastUpdate.getTime() > 5000 && !mappingSensors) {
        DOMElements.hardware.style.display = "none";
        DOMElements.header.style.display = "none";
        DOMElements.loading.style.display = "flex";
      }
    },1000)
  } catch (err) {
    console.log(err);
    return;
  }

}

init();


