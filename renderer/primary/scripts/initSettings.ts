import { DOMElements } from "../../shared/elements.js";
import { changeOverlayOpacity, changeIconSize, changeFontSize, changeColors } from "../../shared/handlers/settingsHandlers.js";

export const initSettings = () => {

  if (!(window.localStorage.getItem("textColor"))) changeColors("#FFFFFF");
  else changeColors(window.localStorage.getItem("textColor") as string);

  if (!(window.localStorage.getItem("iconSize"))) changeIconSize("50px");
  else changeIconSize(window.localStorage.getItem("iconSize") as string);

  if (!(window.localStorage.getItem("fontSize"))) changeFontSize("12px");
  else changeFontSize(window.localStorage.getItem("fontSize") as string);

  if (!(window.localStorage.getItem("overlayOpacity"))) changeOverlayOpacity(50);
  else changeOverlayOpacity(parseFloat(window.localStorage.getItem("overlayOpacity") as string) * 100);

  DOMElements.overlayNumber.value = (parseFloat(window.localStorage.getItem("overlayOpacity") as string)*100).toString() as string;
  DOMElements.overlayRange.value = (parseFloat(window.localStorage.getItem("overlayOpacity") as string)*100).toString() as string;
  DOMElements.cardsColorPicker.value = window.localStorage.getItem("textColor")?.slice(0, 7) as string;
  DOMElements.appsSizeNumber.value = window.localStorage.getItem("iconSize")?.replace("px", "") as string;
  DOMElements.appsSizeRange.value = window.localStorage.getItem("iconSize")?.replace("px", "") as string;
  DOMElements.fontSizeNumber.value = window.localStorage.getItem("fontSize")?.replace("px", "") as string;
  DOMElements.fontSizeRange.value = window.localStorage.getItem("fontSize")?.replace("px", "") as string;
}