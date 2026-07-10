
import { injectApps } from "../../shared/appsInjection.js";
import { InitializeBackground } from "../../shared/dataFetchers/backgroundsFetch.js";
import { addBgHandlers } from "./handlers/backgroundHandlers.js";
import { addModesHandlers, setMode } from "./handlers/modesHandlers.js";
import { addSettingsHandlers, mappingSensors } from "../../shared/handlers/settingsHandlers.js";
import { addSettingsHandlers as addSettingsHandlers2 } from "./handlers/settingsHandlers.js";
import { initSettings } from "./initSettings.js";
import { fetchSensorsMap } from "../../shared/dataFetchers/sensorsMapFetcher.js";
import { addAppsHandlers } from "./handlers/appsHandlers.js";
import { BgData, LabelMapping, ModeObject, SensorsData } from "../../shared/types.js";
import { specsFetch } from "../../shared/dataFetchers/specsFetch.js";
import { DOMElements } from "../../shared/elements.js";
import { setCoresStructure, setFansStructure, setGpuStructure } from "../../shared/sensors/setStructure.js";
import { updateUi } from "../../shared/sensors/updateUi.js";




const init = async () => {
  try {


    let bgData = await InitializeBackground();
    addBgHandlers(bgData as BgData);
    initSettings();
    addSettingsHandlers();
    addSettingsHandlers2();
    addModesHandlers();
    addAppsHandlers();
    injectApps();
    let specs = await specsFetch();
    DOMElements.cpuName.textContent = specs.cpu;
    await fetchSensorsMap().then((sensorsMap: LabelMapping) => {
      setCoresStructure(sensorsMap.cpu.cores.length);
      setFansStructure(sensorsMap);
      setGpuStructure(sensorsMap, specs)
    });
    const mode = (window.localStorage.getItem("mode") || "normal") as keyof ModeObject;
    setMode(mode);

    let lastMouseMove = Date.now();
    let appIsFocused = true;

    document.addEventListener('mousemove', () => {
      lastMouseMove = Date.now();
      appIsFocused = true;
      DOMElements.videoBg.paused ? DOMElements.videoBg.play() : null;
    });

    setInterval(() => {
      const idleTime = Date.now() - lastMouseMove;
      if (idleTime > 60000 && appIsFocused && !DOMElements.videoBg.paused) {
        appIsFocused = false;
        DOMElements.videoBg.pause();
      }
    }, 1000);


    let lastUpdate: Date = new Date();
    window.api.onDiagnosticUpdate(async (data: SensorsData) => {
      lastUpdate = new Date();
      if (data && !mappingSensors && appIsFocused) await updateUi(data)
    })

    setInterval(() => {
      if (new Date().getTime() - lastUpdate.getTime() > 5000 && !mappingSensors) {
        DOMElements.hardware.style.display = "none";
        DOMElements.header.style.display = "none";
        DOMElements.loading.style.display = "flex";
      }
    }, 1000)

  } catch (err) {
    console.log(err);
    return;
  }

}

init();


