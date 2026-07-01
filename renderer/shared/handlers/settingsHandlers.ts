import { settingsOnHold } from "../../primary/scripts/handlers/settingsHandlers.js";
import { DOMElements } from "../elements.js";


export const changeOverlayOpacity = (overlayOpacity: number) => {
  console.log(overlayOpacity)
  document.documentElement.style.setProperty('--overlay-opacity', (overlayOpacity / 100).toString())
  window.localStorage.setItem('overlayOpacity', (overlayOpacity / 100).toString())
}
export const changeColors = (color: string) => {
  const opacities = ["1A", "33", "4D", "66", "80", "99", "B3", "CC", "E6", "FF"];

  opacities.forEach((hex, i) => {
    document.documentElement.style.setProperty(`--color-opacity-${i + 1}`, color + hex);
  });

  window.localStorage.setItem("textColor", color);
}

export const changeIconSize = (size: string) => {
  document.documentElement.style.setProperty("--icon-size", size);
  window.localStorage.setItem("iconSize", size);
}

export const changeFontSize = (size: string) => {
  document.documentElement.style.setProperty("--font-size", size);
  window.localStorage.setItem("fontSize", size);
}

export const iconSizeEventHandler = (event: Event, size?: number) => {
  
  debugger

  if(size) {
    changeIconSize(size + "px");
    return
  }

  size = (event.target as HTMLInputElement)?.value as unknown as number;
  settingsOnHold.appSize = size

  if ((event.target as HTMLInputElement)?.type === "range") DOMElements.appsSizeNumber.value = size.toString();
  else DOMElements.appsSizeRange.value = size.toString();

}

export const fontSizeEventHandler = (event: Event, fontSize?: number) => {

  if(fontSize) {
    changeFontSize(fontSize + "px");
    return
  }

  let font = (event.target as HTMLInputElement)?.value as unknown as number;
  settingsOnHold.fontSize = font

  if ((event.target as HTMLInputElement)?.type === "range") DOMElements.fontSizeNumber.value = font.toString();
  else DOMElements.fontSizeRange.value = font.toString();

}

export const OverlayEventHandler = (event: Event,opacity?: number) => {

  if(opacity || opacity === 0) {
    changeOverlayOpacity(opacity);
    return
  }

  opacity = parseInt((event.target as HTMLInputElement)?.value);
  settingsOnHold.overlayOpacity = opacity


  if ((event.target as HTMLInputElement)?.type === "range") DOMElements.overlayNumber.value = opacity.toString();
  else DOMElements.overlayRange.value = opacity.toString();
}

let perCoreView : boolean = false;

export const getPerCoreView = () => perCoreView

export let mappingSensors : boolean = false;
export const setMappingSensors = (loading: boolean) => mappingSensors = loading

export const addSettingsHandlers = () => {
  
  DOMElements.perCoreTitle?.addEventListener("click", () => {
    perCoreView = true;
    DOMElements.hardware.style.display = "none";
    DOMElements.percoreContainer.style.display = "flex";
  }
  )

  window.api.onMappingError((error) => {
    DOMElements.sensorError.style.display = "flex";
    DOMElements.hardware.style.display = "none";
    DOMElements.errorLabel.textContent = error;
    DOMElements.header.style.display = "none";
    DOMElements.sensorMappingWaiting.style.display = "none";
    DOMElements.loading.style.display = "none";
  })

  window.api.onMappingFinished(() => {
    mappingSensors = false;
    DOMElements.sensorError.style.display = "none";
    DOMElements.hardware.style.display = "flex";
    DOMElements.header.style.display = "flex";
    DOMElements.sensorMappingWaiting.style.display = "none";
    DOMElements.loading.style.display = "none";
  })

  window.api.onMappingStart(() => {
    mappingSensors = true;
    DOMElements.sensorError.style.display = "none";
    DOMElements.hardware.style.display = "none";
    DOMElements.header.style.display = "none";
    DOMElements.sensorMappingWaiting.style.display = "flex";
    DOMElements.loading.style.display = "none";
  })

  DOMElements.refreshButton?.addEventListener("click", () => {
    window.api.refreshWindows();
  })

    window.addEventListener('keydown', (e) => {
    if (e.key === 'F4' && e.altKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  DOMElements.backToMain?.addEventListener("click", () => {
    perCoreView = false;
    DOMElements.hardware.style.display = "flex";
    DOMElements.percoreContainer.style.display = "none";
  })


}


// Done