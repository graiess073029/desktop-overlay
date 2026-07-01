import { DOMElements } from "../../../shared/elements.js";
import { openDeleteModal } from "./backgroundHandlers.js";
import { changeColors, iconSizeEventHandler, fontSizeEventHandler, OverlayEventHandler } from "../../../shared/handlers/settingsHandlers.js";
import { Settings } from "../../../shared/types.js";
import { initSettings } from "../initSettings.js";

let settingsLoading: boolean = false;

export const setSettingLoading = (loading: boolean) => settingsLoading = loading

const spawnLoading = () => {
  DOMElements.settings.style.display = "none";
  DOMElements.settingsLoading.style.display = "flex";
  settingsLoading = true;
}

export const settingsOnHold : Settings = {
  appSize : null,
  fontSize : null,
  overlayOpacity : null,
  textColor : null
}

const clearSettingsOnHold = () => {
  settingsOnHold.appSize = null;
  settingsOnHold.fontSize = null;
  settingsOnHold.overlayOpacity = null;
  settingsOnHold.textColor = null;
  initSettings();
}

const saveSettings = () => {
  debugger;
  if (settingsOnHold.textColor?.length) changeColors(settingsOnHold.textColor);
  if(settingsOnHold.appSize)  iconSizeEventHandler(new Event(""), settingsOnHold.appSize);
  if(settingsOnHold.fontSize) fontSizeEventHandler( new Event(""),settingsOnHold.fontSize);
  if(settingsOnHold.overlayOpacity || settingsOnHold.overlayOpacity === 0) OverlayEventHandler(new Event(""),settingsOnHold.overlayOpacity);
  clearSettingsOnHold();
}

export const addSettingsHandlers = () => {
  DOMElements.cardsColorPicker?.addEventListener("input", (event) => {
    let color = (event.target as HTMLInputElement)?.value as string;
    settingsOnHold.textColor = color;
  });

  DOMElements.appsSizeNumber?.addEventListener("input", iconSizeEventHandler);
  DOMElements.appsSizeRange?.addEventListener("input", iconSizeEventHandler);
  DOMElements.fontSizeNumber?.addEventListener("input", fontSizeEventHandler);
  DOMElements.fontSizeRange?.addEventListener("input", fontSizeEventHandler);

  DOMElements.mode?.addEventListener("click", (event) => {
    DOMElements.blur.style.display = "block";
    DOMElements.modesDiv.style.display = "flex";
    DOMElements.background.style.filter = "blur(8px)";
    DOMElements.root_inner.style.filter = "blur(8px)";
  });

  DOMElements.blur?.addEventListener("click", (event) => {
    if (!settingsLoading) {
      DOMElements.modesDiv.style.display = "none";
      DOMElements.blur.style.display = "none";
      DOMElements.bgSelector.style.display = "none";
      DOMElements.BgDeleter.style.display = "none";
      DOMElements.settings.style.display = "none";
      DOMElements.appDeleter.style.display = "none";
      DOMElements.appNameSetter.style.display = "none"
      DOMElements.background.style.filter = "blur(0px)";
      DOMElements.root_inner.style.filter = "blur(0px)";
      clearSettingsOnHold();
    }
  });

  DOMElements.settingsBtn?.addEventListener("click", () => {
    DOMElements.blur.style.display = "block";
    DOMElements.settings.style.display = "flex";
  });

  DOMElements.bgSelectBtn?.addEventListener("click", () => {
    DOMElements.blur.style.display = "block";
    DOMElements.bgSelector.style.display = "flex";
    DOMElements.settings.style.display = "none";
  });

  DOMElements.bgDeleteBtn?.addEventListener("click", () => {
    let backgrounds = JSON.parse(window.localStorage.getItem("backgroundsData") as string);
    let bgIndex = parseInt(window.localStorage.getItem("bgIndex") as string);
    openDeleteModal(bgIndex);
    DOMElements.bgDeleted.src = backgrounds[bgIndex].type === "image" ? backgrounds[bgIndex].path : backgrounds[bgIndex].poster as string;
    DOMElements.blur.style.display = "block";
    DOMElements.BgDeleter.style.display = "flex";
    DOMElements.settings.style.display = "none";
  });

  DOMElements.bgAddBtn?.addEventListener("click", async () => {
    let path = await window.api.pickFile();
    if (path) {
      spawnLoading();
      window.api.addBackground(path).then(() => {
        let bgIndex = (Object.keys(JSON.parse(window.localStorage.getItem("backgroundsData") as string)).length).toString();
        window.localStorage.setItem("bgIndex", bgIndex)
        window.api.refreshWindows();
      });
    }
  })

  DOMElements.overlayNumber?.addEventListener('input', OverlayEventHandler)
  DOMElements.overlayRange?.addEventListener('input', OverlayEventHandler)

  DOMElements.saveSettings?.addEventListener("click", (event) => {
    saveSettings();
    window.api.refreshWindows();
  })

  DOMElements.quitSettings?.addEventListener("click", (event) => {
    DOMElements.blur.style.display = "none";
    DOMElements.settings.style.display = "none";
    window.api.refreshWindows();
  })

  DOMElements.closeAppsDeleter?.addEventListener("click", (event) => {
    DOMElements.appDeleter.style.display = "none";
    DOMElements.appNameSetter.style.display = "none";
    DOMElements.settings.style.display = "flex";
  })

  DOMElements.newMapping.addEventListener("click", () => {
    DOMElements.sensorError.style.display = "none";
    DOMElements.hardware.style.display = "none";
    DOMElements.header.style.display = "none";

    if (window.navigator.onLine) {

      DOMElements.sensorMappingWaiting.style.display = "flex";
      DOMElements.loading.style.display = "none";

      window.api.requestSensorsMapping().then((sensorMap) => {
        window.localStorage.setItem("sensorsMap", JSON.stringify(sensorMap));
        window.api.refreshWindows();
      });

    }

    else {

      DOMElements.sensorError.style.display = "flex";
      DOMElements.errorLabel.textContent = "No Internet Connection. Please try later."

      setTimeout(() => {
        DOMElements.sensorError.style.display = "none";
        DOMElements.hardware.style.display = "flex";
        DOMElements.header.style.display = "flex";
      }, 5000)

    }

  })

}