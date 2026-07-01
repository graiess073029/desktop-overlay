import { addApp } from "../../../shared/appsInjection.js";
import {  App } from "../../../shared/types.js";



export const addAppsHandlers = () => {

    window.api.onAppAdd(async (app : App) => {
      await addApp(app);
    })

}