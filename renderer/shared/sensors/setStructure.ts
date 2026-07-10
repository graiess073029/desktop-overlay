import { DOMElements } from "../elements.js";
import { LabelMapping } from "../types.js";

const CoreTemplate = (i: number) => `<div class="core">
        <div  id="${i}Bar" class="bar"></div>
        <p id="${i}Load" ></p>
        <p id="${i}Clock"></p>
        <p id="${i}Temp"></p>
      </div>`;

export const setCoresStructure = (n: number): void => {

    for (let i = 0; i < n; i++) {
        DOMElements.cores.innerHTML += CoreTemplate(i);
    }

}

export const setFansStructure = (sensorsMap: LabelMapping): void => {

    try {


        let fansCoreHtmlFront = "";
        let fansCoreHtmlBack = "";

        const title = "<h1>Fans</h1>"

        for (let i = 0; i < sensorsMap.fans.length; i++) {

            const fan = sensorsMap.fans[i];

            if (i <= 4) {
                fansCoreHtmlFront += `<div>
                                        <p>${fan.name}</p>
                                        <p id="fan${i}"></p>
                                    </div>
                                    <div class="bar">
                                        <div id="fan${i}bar"  ></div>
                                    </div>`
            }

            else {
                fansCoreHtmlBack += `<div>
                                        <p>${fan.name}</p>
                                        <p id="fan${i}"></p>
                                    </div>
                                    <div class="bar">
                                        <div id="fan${i}bar"  ></div>
                                    </div>`
            }

        }

        if (sensorsMap.fans.length > 5 && sensorsMap.fans.length < 10) {

            for (let i = 0; i < sensorsMap.fans.length - 5; i++) {

                fansCoreHtmlBack += `
        <div>
            <p>--</p>
            <p>--</p>
          </div>
          <div class="bar" style="background : transparent"> </div>
      `;

            }
        }

        else if (sensorsMap.fans.length < 5) {

            for (let i = 0; i < 5 - sensorsMap.fans.length; i++) {

                fansCoreHtmlFront += `
        <div>
            <p>--</p>
            <p>--</p>
          </div>
          <div class="bar" style="background : transparent"> </div>
      `;

            }
        }

        if (fansCoreHtmlBack.length === 0) {
            DOMElements.fansCard.innerHTML = `
                ${title}
                <div class="info">
                    ${fansCoreHtmlFront}
                </div>
            `
        }

        else {
            DOMElements.fansCard.innerHTML = `
                <div class="front">
                    ${title}
                <div class="info">
                    ${fansCoreHtmlFront}
                </div>
                </div>

                <div class="back">
                    ${title}
                <div class="info">
                    ${fansCoreHtmlBack}
                </div>
                </div>
            `
        }

    }
    catch (err) {
        console.log(err);
    }





}

const defineDgpuHtmlElements = () => {
  DOMElements.gpuUsage= document.querySelector("#gpuUsage") as HTMLElement;
  DOMElements.gpuUsageBar= document.querySelector("#gpuUsageBar") as HTMLElement;
  DOMElements.vramUsage= document.querySelector("#vramUsage") as HTMLElement;
  DOMElements.vramUsageBar= document.querySelector("#vramUsageBar") as HTMLElement;
  DOMElements.vramMax = document.getElementById("vramMax") as HTMLElement;
  DOMElements.gpuClock= document.querySelector("#gpuClock") as HTMLElement;
  DOMElements.gpuClockBar= document.querySelector("#gpuClockBar") as HTMLElement;
  DOMElements.gpuTemp= document.querySelector("#gpuTemp") as HTMLElement;
  DOMElements.gpuTempBar= document.querySelector("#gpuTempBar") as HTMLElement;
  DOMElements.gpuPower= document.querySelector("#gpuPower") as HTMLElement;
  DOMElements.dgpuName = document.getElementById("dGpuName") as HTMLElement;
}

const defineIgpuHtmlElements = () => {
  DOMElements.IgpuUsage= document.querySelector("#IgpuUsage") as HTMLElement;
  DOMElements.IgpuUsageBar= document.querySelector("#IgpuUsageBar") as HTMLElement;
  DOMElements.IvramUsage= document.querySelector("#IvramUsage") as HTMLElement;
  DOMElements.IvramUsageBar= document.querySelector("#IvramUsageBar") as HTMLElement;
  DOMElements.IgpuClock= document.querySelector("#IgpuClock") as HTMLElement;
  DOMElements.IgpuClockBar= document.querySelector("#IgpuClockBar") as HTMLElement;
  DOMElements.igpuName = document.getElementById("iGpuName") as HTMLElement;
DOMElements.igpuPower = document.getElementById("IgpuPower") as HTMLElement;
  DOMElements.igpuTemp = document.getElementById("IgpuTemp") as HTMLElement;
  DOMElements.igpuTempBar = document.getElementById("IgpuTempBar") as HTMLElement;
  DOMElements.igpuVramUsage = document.getElementById("IvramUsage") as HTMLElement;
  DOMElements.igpuVramUsageBar = document.getElementById("IvramUsageBar") as HTMLElement;
  DOMElements.IvramMax = document.getElementById("IvramMax") as HTMLElement;
}

export const setGpuStructure = (sensorsMap: LabelMapping,specs : any): void => {

    const iGpuCard = `<h1>Graphics Card <span id="iGpuName"></span></h1>
                            <div class="info">
                                <div>
                                    <p>Usage</p>
                                    <p id="IgpuUsage"></p>
                                </div>
                                <div class="bar">
                                    <div id="IgpuUsageBar"></div>
                                </div>
                                <div>
                                    <p>VRAM Usage</p>
                                    <p> <span id="IvramUsage"></span> | <span id="IvramMax"></span></p>
                                </div>
                                <div class="bar">
                                    <div id="IvramUsageBar"></div>
                                </div>
                                <div>
                                    <p>Clock</p>
                                    <p id="IgpuClock"></p>
                                </div>
                                <div class="bar">
                                    <div id="IgpuClockBar"></div>
                                </div>
                                <div>
                                    <p>Temperature</p>
                                    <p id="IgpuTemp"></p>
                                </div>
                                <div class="bar">
                                    <div id="IgpuTempBar"></div>
                                </div>
                                <div>
                                    <p>Power</p>
                                    <p id="IgpuPower"></p>  
                                </div>
                                <div class="bar" style="background: transparent;"></div>
        </div>`;

    const dGpuCard = `<h1>Graphics <span id="dGpuName"></span></h1>
                            <div class="info">
                                <div>
                                    <p>Usage</p>
                                    <p id="gpuUsage"></p>
                                </div>
                                <div class="bar">
                                    <div id="gpuUsageBar"></div>
                                </div>
                                <div>
                                    <p>VRAM Usage</p>
                                    <p> <span id="vramUsage"></span> | <span id="vramMax"></span></p>
                                </div>
                                <div class="bar">
                                    <div id="vramUsageBar"></div>
                                </div>
                                <div>
                                    <p>Clock</p>
                                    <p id="gpuClock"></p>
                                </div>
                                <div class="bar">
                                    <div id="gpuClockBar"></div>
                                </div>
                                <div>
                                    <p>Temperature</p>
                                    <p id="gpuTemp"></p>
                                </div>
                                <div class="bar">
                                    <div id="gpuTempBar"></div>
                                </div>
                                <div>
                                    <p>Power</p>
                                    <p id="gpuPower"></p>
                                </div>
                                <div class="bar" style="background: transparent;"></div>
        </div>`;
    
    if (sensorsMap.gpu.usage != null && sensorsMap.iGpu.usage != null){
        DOMElements.gpuCard.innerHTML = `
            <div class="front">${dGpuCard}</div>
            <div class="back">${iGpuCard}</div>
        `

        
        defineDgpuHtmlElements();
        defineIgpuHtmlElements();
        DOMElements.dgpuName.textContent = specs.dGPU;
        DOMElements.igpuName.textContent = specs.iGPU;
    }

    else if (sensorsMap.gpu.usage != null && sensorsMap.iGpu.usage == null){
        DOMElements.gpuCard.innerHTML = dGpuCard
        defineDgpuHtmlElements();
        DOMElements.dgpuName.textContent = specs.dGPU;
    }

    else if (sensorsMap.gpu.usage == null && sensorsMap.iGpu.usage != null){
        DOMElements.gpuCard.innerHTML = iGpuCard;
        defineIgpuHtmlElements();        
        DOMElements.igpuName.textContent = specs.iGPU;
    }

    else {
         DOMElements.gpuCard.innerHTML = "Go Buy A Gpu You Idiot"
    }


}

export const setBatteryDisplay = (sensorsMap: LabelMapping): void => {

    if (sensorsMap.battery.level != null) {
        DOMElements.batteryLevel.style.display = "flex";
        DOMElements.batteryIcon.style.display = "flex";
    }

    else {
        DOMElements.batteryLevel.style.display = "none";
        DOMElements.batteryIcon.style.display = "none";
    }

}
