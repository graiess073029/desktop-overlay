

export const fetchSensorsMap = async (): Promise<any> => {

    try {
        const sensorsMap = localStorage.getItem("sensorsMap");
        if (!sensorsMap) throw new Error("Sensors map not found in local storage");
        return JSON.parse(sensorsMap);
    }
    catch (err) {
        console.log("Error fetching sensors map:", err);
        const sensorsMap = await window.api.requestSensorsMapping();
        if (sensorsMap) {
            localStorage.setItem("sensorsMap", JSON.stringify(sensorsMap));
            return sensorsMap;
        }
        else {
            // Handling the error
            return;
        };
    }

}