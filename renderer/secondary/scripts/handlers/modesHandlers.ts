import { modesIcons } from "../../../shared/constants.js";
import { DOMElements } from "../../../shared/elements.js";
import { ModeObject } from "../../../shared/types.js";

export const setMode = (mode: keyof ModeObject) => {

    window.localStorage.setItem("mode", mode);

    DOMElements.blur.style.display = "none";
    DOMElements.background.style.filter = "blur(0px)";
    DOMElements.root_inner.style.filter = "blur(0px)";
    DOMElements.modeText.textContent = mode;
    DOMElements.modeIcon.innerHTML = modesIcons[mode];

}
