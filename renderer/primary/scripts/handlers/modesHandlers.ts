import { modesIcons } from "../../../shared/constants.js";
import { fetchModes } from "../../../shared/dataFetchers/modeFetch.js";
import { DOMElements } from "../../../shared/elements.js";
import { ModeObject } from "../../../shared/types.js";

let modes: ModeObject = await fetchModes();



export const setMode = (mode: keyof ModeObject) => {

    window.localStorage.setItem("mode", mode);

    DOMElements.blur.style.display = "none";
    DOMElements.modesDiv.style.display = "none";
    DOMElements.background.style.filter = "blur(0px)";
    DOMElements.root_inner.style.filter = "blur(0px)";
    DOMElements.modeText.textContent = mode;
    DOMElements.modeIcon.innerHTML = modesIcons[mode];

    DOMElements.gamingButton.classList.toggle("active-mode", mode === "gaming");
    DOMElements.normalButton.classList.toggle("active-mode", mode === "normal");
    DOMElements.ecoButton.classList.toggle("active-mode", mode === "eco");

    modes[mode].forEach((cmd) => window.api.executeCommand(cmd));
}

export const addModesHandlers = () => {
    DOMElements.gamingButton.addEventListener("click", () => setMode("gaming"));
    DOMElements.normalButton.addEventListener("click", () => setMode("normal"));
    DOMElements.ecoButton.addEventListener("click", () => setMode("eco"));
}