
const modesData = {
    "gaming": [
        "powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
    ],
    "normal": [
        "powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e"
    ],
    "eco": [
        "powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a"
    ]
};

export const getModesData = () => {
    try {
        return modesData;
    } catch (err) {
        console.error("Error getting modes data:", err);
        throw err;
    }
}


