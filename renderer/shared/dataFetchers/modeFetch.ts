import { ModeObject } from "../types.js";



const fallBack: ModeObject = {
    "gaming": [
        "powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
    ],
    "normal": [
        "powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e"
    ],
    "eco": [
        "powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a"
    ]
}

export const fetchModes = async (): Promise<ModeObject> => {
    try {
        const modes = await window.api.getModesData();
        if (!modes) throw new Error("Couldn't fetch modes data");
        return modes;
    }
    catch (err) {
        console.log(err);
        return fallBack;
    }
}