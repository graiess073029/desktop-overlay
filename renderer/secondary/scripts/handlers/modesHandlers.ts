import { modesIcons } from "../../../shared/constants.js";
import { DOMElements } from "../../../shared/elements.js";
import { ModeObject } from "../../../shared/types.js";

export const setMode = (mode: keyof ModeObject) => {

    window.localStorage.setItem("mode", mode);

    DOMElements.blur.style.display = "none";
    DOMElements.modeText.textContent = mode;
    DOMElements.modeIcon.innerHTML = modesIcons[mode];

}
