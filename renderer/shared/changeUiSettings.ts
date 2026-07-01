import { changeOverlayOpacity, changeIconSize, changeFontSize, changeColors } from "./handlers/settingsHandlers.js";

export const initSettings = () => {

  if (!(window.localStorage.getItem("textColor"))) changeColors("#FFFFFF");
  else changeColors(window.localStorage.getItem("textColor") as string);

  if (!(window.localStorage.getItem("iconSize"))) changeIconSize("50px");
  else changeIconSize(window.localStorage.getItem("iconSize") as string);

  if (!(window.localStorage.getItem("fontSize"))) changeFontSize("12px");
  else changeFontSize(window.localStorage.getItem("fontSize") as string);

  if (!(window.localStorage.getItem("overlayOpacity"))) changeOverlayOpacity(50);
  else changeOverlayOpacity(parseFloat(window.localStorage.getItem("overlayOpacity") as string) * 100);
  
}