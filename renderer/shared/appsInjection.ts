import { DOMElements } from "./elements.js";
import { App } from "./types.js";



export const injectApps = async (): Promise<void> => {

  try {

    debugger;

    // 1. Get scale (Added a fallback to 1 just in case the CSS var is missing)
    const scaleString = getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim();
    const uiScale = parseFloat(scaleString) || 1;

    // 2. Calculate individual element sizes
    const appContainerWidth = Math.max(72, Math.min(100 * uiScale, 140));
    const gap = Math.max(12, Math.min(30 * uiScale, 48));


    // 3. Calculate available bounds
    const vw = window.innerWidth / 100;
    const appsSectionWidth = Math.max(160, Math.floor(37 * vw));

    // 4. THE FIX: Calculate capacity accounting for the gaps
    let appsSectionCapacity = Math.trunc((appsSectionWidth) / (appContainerWidth));

    // 5. THE FIX: Calculate final width, ensuring we don't multiply by a negative gap if capacity is 0
    let totalGaps = Math.max(0, appsSectionCapacity - 1);
    let appSectionWidth = (appsSectionCapacity * appContainerWidth) + (totalGaps * gap) + 30;

    while (appSectionWidth > appsSectionWidth) {
      appsSectionCapacity -= 1;

      // 5. THE FIX: Calculate final width, ensuring we don't multiply by a negative gap if capacity is 0
      totalGaps = Math.max(0, appsSectionCapacity - 1);
      appSectionWidth = (appsSectionCapacity * appContainerWidth) + (totalGaps * gap) + 30;
    }

    // 6. Apply
    DOMElements.container.style.width = `${appSectionWidth - 2}px`;




    const data = await window.api.getAppsData();

    if (!data) throw new Error("Could not load apps data");

    // Inject apps into the HTML

    let html = "";

    for (const [name, app] of Object.entries(data)) {
      html += `
    <button data-process="${app.process}" class="app">
      <img src="${app.img}" alt="${app.displayedName}"/>
      <p>${app.displayedName}</p>
    </button>`;
    }

    DOMElements.container.innerHTML = html;

    // adds click listeners to apps

    (document.querySelectorAll(".app") as unknown as HTMLDivElement[]).forEach((app) => {
      app.addEventListener("click", () => {
        let command;
        if (!app.dataset.process?.includes(".bat")) command = `"${app.dataset.process}"`
        else command = `cd ${app.dataset.process.split("\\").slice(0, -1).join("\\")} && start "${app.dataset.process}"`
        window.api.executeCommand(command)
      });
    });
  }

  catch (err) {
    console.log(err);
  }
}

export const addApp = async (app: App): Promise<void> => {

  try {

    let button = document.createElement("button");
    button.dataset.process = app.process;
    button.classList.add("app");
    button.innerHTML = `
      <img src="${app.img}" alt="${app.displayedName}"/>
      <p>${app.displayedName}</p>
      `;

    DOMElements.container.appendChild(button);

    // adds click listeners to apps

    button.addEventListener("click", () => {
      let command;
      if (!button.dataset.process?.includes(".bat")) command = `"${button.dataset.process}"`
      else command = `cd ${button.dataset.process.split("\\").slice(0, -1).join("\\")} && start "${button.dataset.process}"`
      window.api.executeCommand(command)
    });
  }

  catch (err) {
    console.log(err);
  }
}