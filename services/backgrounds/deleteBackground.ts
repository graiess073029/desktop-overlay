import { writeFile } from "fs/promises";
import { BackgroundObject } from "../../types";
import { bgDataPath, getBackgroundsData } from "./getBackgroundsData";


export const deleteBackground = async (index: number): Promise<true> => {
    try {
        console.log("Deleting background at index:", index);
        let backgrounds: BackgroundObject[] = await getBackgroundsData();
        
        if (!backgrounds || backgrounds.length === 0) {
            throw new Error("No backgrounds data found");
        }
        
        if (index < 0 || index >= backgrounds.length) {
            throw new Error("Invalid index");
        }
        
        if (backgrounds.length === 1) {
            throw new Error("Cannot delete the last background");
        }
        
        const newBackgrounds = backgrounds.filter((_, i) => i !== index);
        
        await writeFile(
            bgDataPath, 
            JSON.stringify(newBackgrounds, null, 2)  
        );
        
        return true;
    } catch (err) {
        console.error('Error deleting background:', err);
        throw err;
    }
};