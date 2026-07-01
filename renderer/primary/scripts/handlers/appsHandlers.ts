import { addApp } from "../../../shared/appsInjection.js";
import { DOMElements } from "../../../shared/elements.js";
import {  App, AppsData } from "../../../shared/types.js";
import { setSettingLoading } from "./settingsHandlers.js";



export const addAppsHandlers = () => {

    DOMElements.settings.style.display = "none";

    DOMElements.appsAddBtn.addEventListener("click", async (event) => {
        let path = await window.api.pickApp();
        if (path) {

            DOMElements.settings.style.display = "none";
            DOMElements.appNameSetter.style.display = "flex"

            let appName: string = path.split("\\").pop()?.split(".")[0] || "";

            DOMElements.appNameInput.value = appName    ;
            DOMElements.appNameInput.addEventListener("input", (event) => appName = (event.currentTarget as HTMLInputElement).value)

            DOMElements.addApp.addEventListener("click", async (event) => {


                if (!appName.length) event.preventDefault();
                else {
                    DOMElements.settingsLoading.style.display = "flex";
                    DOMElements.appNameSetter.style.display = "none";
                    const app = {path, displayedName : appName}
                    window.api.addApp(app).then(() => {
                        window.api.refreshWindows();
                    });
                }

            })



        }
    });

    DOMElements.appsDeleteBtn.addEventListener("click", async (event) => {
        DOMElements.appDeleter.style.display = "flex"
        DOMElements.settings.style.display = "none";

        const apps: AppsData = await window.api.getAppsData() as AppsData;

        let appsToDelete: string[] = [];

        DOMElements.appsToDelete.innerHTML = "";

        for (const app in apps) {
            const div = document.createElement("div");
            div.classList.add("app");
            div.dataset.process = apps[app].process;

            const name = apps[app].process.split("\\").pop()?.split(".")[0] || "";

            div.innerHTML = `
    <img src="${apps[app].img}" alt="${name}"/>
    <p>${name}</p>
  `;

            div.addEventListener("click", (e) => {


                if (!appsToDelete.includes(div.dataset.process as string)) {
                    appsToDelete.push(div.dataset.process as string)
                    div.classList.add("appSelected");
                }
                else {
                    appsToDelete = appsToDelete.filter(e => e !== div.dataset.process as string)
                    div.classList.remove("appSelected");
                }


            });


            DOMElements.appsToDelete.appendChild(div);


        }

        DOMElements.deleteApps.addEventListener("click", async (event) => {
            DOMElements.settingsLoading.style.display = "flex";
            DOMElements.appDeleter.style.display = "none";
            await window.api.deleteApp(appsToDelete).then(() => window.api.refreshWindows())
        })




    });

    DOMElements.imitateDesktop.addEventListener("click", async (event) => {
        DOMElements.container.innerHTML = "";
        DOMElements.settings.style.display = "none";
        DOMElements.settingsLoading.style.display = "flex";
        setSettingLoading(true);
        await window.api.imitateDesktop()?.then(() => window.api.refreshWindows());
    })

     window.api.onAppAdd(async (app : App) => {
      await addApp(app);
    })

}