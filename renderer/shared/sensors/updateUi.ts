import { maxValues, svgBatteryIcons } from "../constants.js";
import { DOMElements } from "../elements.js";
import { getPerCoreView } from "../handlers/settingsHandlers.js";
import { DiscData, SensorsData } from "../types.js";

const updateHeader = (sensorsData: SensorsData) => {

  const dateValue = new Date();

  // Header Time and Date

  (DOMElements.batteryLevel.parentElement as HTMLDivElement).style.display = "flex";
  (DOMElements.time.parentElement as HTMLDivElement).style.display = "flex";

  DOMElements.time.textContent = dateValue
    .toString()
    .split(" ")[4]
    .split(":")
    .slice(0, 2)
    .join(":");

  DOMElements.date.textContent = dateValue.toLocaleDateString("en-GB");

  // Battery — NO null check, as requested
  const batteryLevel = sensorsData.battery?.level as number;
  const batteryChargeRate = sensorsData.battery?.chargeRate as number;

  DOMElements.batteryLevel.textContent = batteryLevel?.toFixed(0) + " %";

  if (batteryChargeRate && batteryChargeRate > 0) {
    DOMElements.batteryIcon.innerHTML = svgBatteryIcons.charging;
  } else if (batteryLevel && batteryLevel >= 95) {
    DOMElements.batteryIcon.innerHTML = svgBatteryIcons.full;
  } else if (batteryLevel && batteryLevel >= 65) {
    DOMElements.batteryIcon.innerHTML = svgBatteryIcons.high;
  } else if (batteryLevel && batteryLevel >= 35) {
    DOMElements.batteryIcon.innerHTML = svgBatteryIcons.half;
  } else if (batteryLevel >= 15) {
    DOMElements.batteryIcon.innerHTML = svgBatteryIcons.low;
  } else {
    DOMElements.batteryIcon.innerHTML = svgBatteryIcons.empty;
  }
}

const updateCpu = (sensorsData: SensorsData) => {
  // CPU

  const cpuUsage = sensorsData.cpu?.usage as number;
  if (cpuUsage != null) {
    DOMElements.cpuUsage.textContent = cpuUsage.toFixed(0) + " %";
    DOMElements.cpuUsageBar.style.width = cpuUsage.toFixed(0) + "%";
  } else {
    DOMElements.cpuUsage.textContent = "N/A";
    DOMElements.cpuUsageBar.style.width = "0%";
  }

  const cpuClock = sensorsData.cpu?.clock as number;
  if (cpuClock != null) {
    DOMElements.cpuClock.textContent = (cpuClock / 1000).toFixed(2) + " GHz";
    DOMElements.cpuClockBar.style.width = (cpuClock / maxValues.cpuClock) * 100 + "%";
  } else {
    DOMElements.cpuClock.textContent = "N/A";
    DOMElements.cpuClockBar.style.width = "0%";
  }

  const cpuTemp = sensorsData.cpu?.temperature as number;
  if (cpuTemp != null) {
    DOMElements.cpuTemp.textContent = cpuTemp.toFixed(0) + " °C";
    DOMElements.cpuTempBar.style.width = (cpuTemp / maxValues.cpuTemp) * 100 + "%";
  } else {
    DOMElements.cpuTemp.textContent = "N/A";
    DOMElements.cpuTempBar.style.width = "0%";
  }

  const cpuPower = sensorsData.cpu?.power;
  DOMElements.cpuPower.textContent = cpuPower != null ? cpuPower.toFixed(0) + " W" : "N/A";

  // Per-core
  if (sensorsData.cpu?.cores) {
    for (let i = 0; i < sensorsData.cpu.cores.length; i++) {
      const core = sensorsData.cpu.cores[i];
      const coreLoad = core?.usage as number;
      const coreClock = core?.clock as number;
      const coreTemp = core?.temperature as number;

      const bar = document.getElementById(`${i}Bar`) as HTMLDivElement;
      const tempLabel = document.getElementById(`${i}Temp`) as HTMLParagraphElement;
      const clockLabel = document.getElementById(`${i}Clock`) as HTMLParagraphElement;
      const loadLabel = document.getElementById(`${i}Load`) as HTMLParagraphElement;

      if (bar) bar.style.height = coreLoad != null ? `${coreLoad.toFixed(0)}%` : "0%";
      if (tempLabel) tempLabel.textContent = coreTemp != null ? `${coreTemp.toFixed(0)} °C` : "N/A";
      if (clockLabel) clockLabel.textContent = coreClock != null ? `${(coreClock / 1000).toFixed(2)} GHz` : "N/A";
      if (loadLabel) loadLabel.textContent = coreLoad != null ? `${coreLoad.toFixed(0)} %` : "N/A";
    }
  }
}

const updateDgpu = (sensorsData: SensorsData) => {
  // GPU
  const gpuUsage = sensorsData.gpu?.usage as number;
  if (gpuUsage != null) {
    DOMElements.gpuUsage.textContent = gpuUsage.toFixed(0) + " %";
    DOMElements.gpuUsageBar.style.width = gpuUsage.toFixed(0) + "%";
  } else {
    DOMElements.gpuUsage.textContent = "N/A";
    DOMElements.gpuUsageBar.style.width = "0%";
  }

  const vramAllocated = sensorsData.gpu?.vramAllocated as number;
  const vramAvailable = sensorsData.gpu?.vramAvailable as number;
  if (vramAllocated != null && vramAvailable != null) {
    DOMElements.vramUsage.textContent = (vramAllocated / 1024).toFixed(1) + " Gb";
    DOMElements.vramUsageBar.style.width = (vramAllocated / (vramAvailable + vramAllocated)) * 100 + "%";
    DOMElements.vramMax.textContent = ((vramAvailable + vramAllocated) / 1024).toFixed(0) + " GB";
  } else {
    DOMElements.vramUsage.textContent = "N/A";
    DOMElements.vramUsageBar.style.width = "0%";
    DOMElements.vramMax.textContent = "N/A";
  }

  const gpuClock = sensorsData.gpu?.clock as number;
  if (gpuClock != null) {
    DOMElements.gpuClock.textContent = gpuClock.toFixed(0) + " MHz";
    DOMElements.gpuClockBar.style.width = (gpuClock / maxValues.gpuClock) * 100 + "%";
  } else {
    DOMElements.gpuClock.textContent = "N/A";
    DOMElements.gpuClockBar.style.width = "0%";
  }

  const gpuTemp = sensorsData.gpu?.temperature as number;
  if (gpuTemp != null) {
    DOMElements.gpuTemp.textContent = gpuTemp.toFixed(0) + " °C";
    DOMElements.gpuTempBar.style.width = (gpuTemp / maxValues.gpuTemp) * 100 + "%";
  } else {
    DOMElements.gpuTemp.textContent = "N/A";
    DOMElements.gpuTempBar.style.width = "0%";
  }

  const gpuPower = sensorsData.gpu?.power as number;
  DOMElements.gpuPower.textContent = gpuPower != null ? gpuPower.toFixed(0) + " W" : "N/A";
}

const updateIgpu = (sensorsData: SensorsData) => {
  // IGPU
  const igpuUsage = sensorsData.iGpu?.usage as number;
  if (igpuUsage != null) {
    DOMElements.IgpuUsage.textContent = igpuUsage.toFixed(0) + " %";
    DOMElements.IgpuUsageBar.style.width = (igpuUsage / 100) * 100 + "%";
  } else {
    DOMElements.IgpuUsage.textContent = "N/A";
    DOMElements.IgpuUsageBar.style.width = "0%";
  }

  const igpuClock = sensorsData.iGpu?.clock as number;
  if (igpuClock != null) {
    DOMElements.IgpuClock.textContent = igpuClock.toFixed(0) + " MHz";
    DOMElements.IgpuClockBar.style.width = (igpuClock / maxValues.gpuClock) * 100 + "%";
  } else {
    DOMElements.IgpuClock.textContent = "N/A";
    DOMElements.IgpuClockBar.style.width = "0%";
  }

  const igpuTemp = sensorsData.iGpu?.temperature as number;
  if (igpuTemp != null) {
    DOMElements.igpuTemp.textContent = igpuTemp.toFixed(0) + " °C";
    DOMElements.igpuTempBar.style.width = (igpuTemp / maxValues.cpuTemp) * 100 + "%";
  } else {
    DOMElements.igpuTemp.textContent = "N/A";
    DOMElements.igpuTempBar.style.width = "0%";
  }

  const igpuVramAllocated = sensorsData.iGpu?.vramAllocated as number;
  const igpuVramAvailable = sensorsData.iGpu?.vramAvailable as number;
  if (igpuVramAllocated != null && igpuVramAvailable != null) {
    DOMElements.igpuVramUsage.textContent = (igpuVramAllocated / 1024).toFixed(1) + " GB";
    DOMElements.igpuVramUsageBar.style.width = (igpuVramAllocated / (igpuVramAvailable + igpuVramAllocated)) * 100 + "%";
    DOMElements.IvramMax.textContent = ((igpuVramAvailable + igpuVramAllocated) / 1024 / 2).toFixed(0) + "GB";
  } else {
    DOMElements.igpuVramUsage.textContent = "N/A";
    DOMElements.igpuVramUsageBar.style.width = "0%";
    DOMElements.IvramMax.textContent = "N/A";
  }

  const igpuPower = sensorsData.iGpu?.power as number;
  DOMElements.igpuPower.textContent = igpuPower != null ? igpuPower.toFixed(0) + " W" : "N/A";
}

const updateRam = (sensorsData: SensorsData) => {
  // RAM
  const memoryUsage = sensorsData.memory?.usage as number;
  const memoryAvailable = sensorsData.memory?.available as number;
  if (memoryUsage != null && memoryAvailable != null) {
    DOMElements.ramUsage.textContent = ((memoryUsage / (memoryAvailable + memoryUsage)) * 100).toFixed(0) + " %";
    DOMElements.ramUsageBar.style.width = (memoryUsage / (memoryAvailable + memoryUsage)) * 100 + "%";
    DOMElements.ramAvailable.textContent = memoryAvailable.toFixed(0) + " MB";
    DOMElements.ramAvailableBar.style.width = (memoryAvailable / (memoryAvailable + memoryUsage)) * 100 + "%";
  } else {
    DOMElements.ramUsage.textContent = "N/A";
    DOMElements.ramUsageBar.style.width = "0%";
    DOMElements.ramAvailable.textContent = "N/A";
    DOMElements.ramAvailableBar.style.width = "0%";
  }
}

const updateFans = (sensorsData: SensorsData) => {
  // Fans
  if (sensorsData.fans) {
    for (let i = 0; i < sensorsData.fans.length; i++) {
      const fanSpeed = sensorsData.fans[i] as number;
      const fanLabel = document.getElementById(`fan${i}`) as HTMLParagraphElement;
      const fanBar = document.getElementById(`fan${i}bar`) as HTMLDivElement;

      if (fanLabel) fanLabel.textContent = fanSpeed != null ? fanSpeed.toFixed(0) + " RPM" : "N/A";
      if (fanBar) fanBar.style.width = fanSpeed != null ? (fanSpeed / maxValues.cpuFan) * 100 + "%" : "0%";
    }
  }
}

const updateDisc = async (sensorsData: SensorsData) => {
  // Disc
  try {
    const discData = await window.api.getDiscData() as DiscData;
    if (discData && discData["Disk Total [GB]"] && discData["Disk Used [GB]"] && discData["Disk Free [GB]"]) {
      DOMElements.discUsage.textContent = discData["Disk Total [GB]"] + " GB";
      DOMElements.discUsageBar.style.width = ((parseFloat(discData["Disk Used [GB]"]) / parseFloat(discData["Disk Total [GB]"])) * 100).toString() + "%";
      DOMElements.discFree.textContent = discData["Disk Free [GB]"] + " GB";
    } else {
      DOMElements.discUsage.textContent = "N/A";
      DOMElements.discUsageBar.style.width = "0%";
      DOMElements.discFree.textContent = "N/A";
    }
  } catch (e) {
    DOMElements.discUsage.textContent = "N/A";
    DOMElements.discUsageBar.style.width = "0%";
    DOMElements.discFree.textContent = "N/A";
  }
}


export const updateUi = async (sensorsData: SensorsData) => {

  try {

    DOMElements.loading.style.display = "none";
    const perCoreView = getPerCoreView();
    if (DOMElements.percoreContainer.style.display !== "flex" && !perCoreView) DOMElements.hardware.style.display = "flex";
    DOMElements.sensorMappingWaiting.style.display = "none";
    DOMElements.sensorError.style.display = "none";
    DOMElements.header.style.display = "flex";
    updateHeader(sensorsData)
    await updateDisc(sensorsData);
    updateCpu(sensorsData);
    updateRam(sensorsData);
    updateFans(sensorsData);
    if (sensorsData.gpu.usage != null) updateDgpu(sensorsData);
    if (sensorsData.iGpu.usage != null) updateIgpu(sensorsData);
  }

  catch (err) {
    console.error(err)
  }

}