import { DOMElements } from "../../../shared/elements.js";
import { BgData } from "../../../shared/types.js";

let bgDeletingIndex: number = 0;

export const openDeleteModal = (bgSelectedValue: number) => {
    bgDeletingIndex = bgSelectedValue;
};


export const addBgHandlers = (bgData: BgData) => {


    DOMElements.bgMinus.addEventListener("click", () => {
        bgData.bgIndex--;
        if (bgData.bgIndex < 0) bgData.bgIndex = bgData.lenBackgrounds - 1;
        const bg = bgData.backgrounds[bgData.bgIndex];
        DOMElements.bgSelected.src = bg.type === "image" ? bg.path : bg.poster as string;
        bgData.bgSelectedValue = bgData.bgIndex;
    });

    DOMElements.bgPlus.addEventListener("click", () => {
        bgData.bgIndex++;
        if (bgData.bgIndex === bgData.lenBackgrounds) bgData.bgIndex = 0;
        const bg = bgData.backgrounds[bgData.bgIndex];
        DOMElements.bgSelected.src = bg.type === "image" ? bg.path : bg.poster as string;
        bgData.bgSelectedValue = bgData.bgIndex;
    });

    DOMElements.apply.addEventListener("click", () => {


        DOMElements.blur.style.display = "none";
        DOMElements.bgSelector.style.display = "none";
        window.localStorage.setItem("bgIndex", bgData.bgSelectedValue.toString());
        const backgroundSelected = bgData.backgrounds[bgData.bgSelectedValue];

        if (backgroundSelected.type === "image") {
            DOMElements.imgBg.style.display = "block";
            DOMElements.videoBg.style.display = "none";
            DOMElements.imgBg.src = backgroundSelected.path;
        } else if (backgroundSelected.type === "video") {
            DOMElements.imgBg.style.display = "none";
            DOMElements.videoBg.style.display = "block";
            DOMElements.videoBg.src = backgroundSelected.path;
        }

        window.api.refreshWindows();
    });

    DOMElements.bgMinus_delete.addEventListener("click", () => {
        bgDeletingIndex--;
        if (bgDeletingIndex < 0) bgDeletingIndex = bgData.lenBackgrounds - 1;
        const bg = bgData.backgrounds[bgDeletingIndex];
        DOMElements.bgDeleted.src = bg.type === "image" ? bg.path : bg.poster as string;
    });

    DOMElements.bgPlus_delete.addEventListener("click", () => {
        bgDeletingIndex++;
        if (bgDeletingIndex === bgData.lenBackgrounds) bgDeletingIndex = 0;
        const bg = bgData.backgrounds[bgDeletingIndex];
        DOMElements.bgDeleted.src = bg.type === "image" ? bg.path : bg.poster as string;
    });


    DOMElements.bgDeleter.addEventListener("click", () => {
        DOMElements.blur.style.display = "none";
        DOMElements.BgDeleter.style.display = "none";

        console.log("Requesting deletion of background at index:", bgDeletingIndex);
        window.api.deleteBackground(bgDeletingIndex).then((result) => {
            console.log("Deletion result:", result);
            // Check if deletion actually succeeded
            if (result instanceof Error) {
                console.error("Failed to delete background:", result.message);
                return;
            }

            // Only compute new index AFTER successful deletion

            debugger;
            
            let newIndex = bgData.bgIndex - 1;

            if (newIndex < 0) newIndex = bgData.lenBackgrounds - 2;
            if (bgData.bgIndex !== bgDeletingIndex) newIndex = bgData.bgIndex - 1;

            window.localStorage.setItem("bgIndex", newIndex.toString());
            window.api.refreshWindows();
        });
    });




}