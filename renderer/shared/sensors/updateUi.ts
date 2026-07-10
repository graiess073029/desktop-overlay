
import { maxValues, svgBatteryIcons } from "../constants.js";
import { DOMElements } from "../elements.js";
import { getPerCoreView } from "../handlers/settingsHandlers.js";
import { DiscData, SensorsData } from "../types.js";

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE: Visibility-aware rendering
// ═══════════════════════════════════════════════════════════════════════════════
let isVisible = true;
document.addEventListener('visibilitychange', () => {
  isVisible = !document.hidden;
});

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE: Cached battery icon state — no innerHTML thrashing
// ═══════════════════════════════════════════════════════════════════════════════
let batteryState: 'charging' | 'full' | 'high' | 'half' | 'low' | 'empty' | null = null;

const updateBatteryIcon = (level: number, chargeRate: number) => {
  let newState: typeof batteryState;
  if (chargeRate > 0) newState = 'charging';
  else if (level >= 95) newState = 'full';
  else if (level >= 65) newState = 'high';
  else if (level >= 35) newState = 'half';
  else if (level >= 15) newState = 'low';
  else newState = 'empty';

  if (newState !== batteryState) {
    batteryState = newState;
    DOMElements.batteryIcon.innerHTML = svgBatteryIcons[newState];
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE: Cached time formatters — avoid string splitting churn
// ═══════════════════════════════════════════════════════════════════════════════
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', hour12: false
});
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric'
});

const updateHeader = (sensorsData: SensorsData) => {
  const dateValue = new Date();

  (DOMElements.batteryLevel.parentElement as HTMLDivElement).style.display = "flex";
  (DOMElements.time.parentElement as HTMLDivElement).style.display = "flex";

  DOMElements.time.textContent = timeFormatter.format(dateValue);
  DOMElements.date.textContent = dateFormatter.format(dateValue);

  const batteryLevel = sensorsData.battery?.level as number;
  const batteryChargeRate = sensorsData.battery?.chargeRate as number;

  DOMElements.batteryLevel.textContent = batteryLevel?.toFixed(0) + " %";
  updateBatteryIcon(batteryLevel ?? 0, batteryChargeRate ?? 0);
};

const updateCpu = (sensorsData: SensorsData) => {
  const cpuUsage = sensorsData.cpu?.usage as number;
  if (cpuUsage != null) {
    const cpuUsagePct = cpuUsage.toFixed(0);
    const cpuUsageScale = Number(cpuUsagePct) / 100;
    DOMElements.cpuUsageBar.style.transform = `scaleX(${cpuUsageScale})`;
    DOMElements.cpuUsage.textContent = cpuUsagePct + " %";
  } else {
    DOMElements.cpuUsage.textContent = "N/A";
    DOMElements.cpuUsageBar.style.width = "0%";
  }

  const cpuClock = sensorsData.cpu?.clock as number;
  if (cpuClock != null) {
    DOMElements.cpuClock.textContent = (cpuClock / 1000).toFixed(2) + " GHz";
    DOMElements.cpuClockBar.style.transform = `scaleX(${(cpuClock / maxValues.cpuClock)})`;
  } else {
    DOMElements.cpuClock.textContent = "N/A";
    DOMElements.cpuClockBar.style.width = "0%";
  }

  const cpuTemp = sensorsData.cpu?.temperature as number;
  if (cpuTemp != null) {
    DOMElements.cpuTemp.textContent = cpuTemp.toFixed(0) + " °C";
    DOMElements.cpuTempBar.style.transform = `scaleX(${cpuTemp / maxValues.cpuTemp})`;
  } else {
    DOMElements.cpuTemp.textContent = "N/A";
    DOMElements.cpuTempBar.style.width = "0%";
  }

  const cpuPower = sensorsData.cpu?.power;
  DOMElements.cpuPower.textContent = cpuPower != null ? cpuPower.toFixed(0) + " W" : "N/A";

  // PERFORMANCE: Only update per-core elements when the view is actually visible
  if (sensorsData.cpu?.cores && DOMElements.percoreContainer.style.display === "flex") {
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
};

const updateDgpu = (sensorsData: SensorsData) => {
  const gpuUsage = sensorsData.gpu?.usage as number;
  if (gpuUsage != null) {
    DOMElements.gpuUsage.textContent = gpuUsage.toFixed(0) + " %";
    DOMElements.gpuUsageBar.style.transform = `scaleX(${parseFloat(gpuUsage.toFixed(0)) / 100})`;
  } else {
    DOMElements.gpuUsage.textContent = "N/A";
    DOMElements.gpuUsageBar.style.width = "0%";
  }

  const vramAllocated = sensorsData.gpu?.vramAllocated as number;
  const vramAvailable = sensorsData.gpu?.vramAvailable as number;
  if (vramAllocated != null && vramAvailable != null) {
    DOMElements.vramUsage.textContent = (vramAllocated / 1024).toFixed(1) + " GB";
    DOMElements.vramUsageBar.style.transform = `scaleX(${vramAllocated / (vramAvailable + vramAllocated)})`;
    DOMElements.vramMax.textContent = ((vramAvailable + vramAllocated) / 1024).toFixed(0) + " GB";
  } else {
    DOMElements.vramUsage.textContent = "N/A";
    DOMElements.vramUsageBar.style.width = "0%";
    DOMElements.vramMax.textContent = "N/A";
  }

  const gpuClock = sensorsData.gpu?.clock as number;
  if (gpuClock != null) {
    DOMElements.gpuClock.textContent = gpuClock.toFixed(0) + " MHz";
    DOMElements.gpuClockBar.style.transform = `scaleX(${gpuClock / maxValues.gpuClock})`;
  } else {
    DOMElements.gpuClock.textContent = "N/A";
    DOMElements.gpuClockBar.style.width = "0%";
  }

  const gpuTemp = sensorsData.gpu?.temperature as number;
  if (gpuTemp != null) {
    DOMElements.gpuTemp.textContent = gpuTemp.toFixed(0) + " °C";
    DOMElements.gpuTempBar.style.transform = `scaleX(${gpuTemp / maxValues.gpuTemp})`;
  } else {
    DOMElements.gpuTemp.textContent = "N/A";
    DOMElements.gpuTempBar.style.width = "0%";
  }

  const gpuPower = sensorsData.gpu?.power as number;
  DOMElements.gpuPower.textContent = gpuPower != null ? gpuPower.toFixed(0) + " W" : "N/A";
};

const updateIgpu = (sensorsData: SensorsData) => {
  const igpuUsage = sensorsData.iGpu?.usage as number;
  if (igpuUsage != null) {
    DOMElements.IgpuUsage.textContent = igpuUsage.toFixed(0) + " %";
    DOMElements.IgpuUsageBar.style.transform = `scaleX(${igpuUsage / 100})`;
  } else {
    DOMElements.IgpuUsage.textContent = "N/A";
    DOMElements.IgpuUsageBar.style.width = "0%";
  }

  const igpuClock = sensorsData.iGpu?.clock as number;
  if (igpuClock != null) {
    DOMElements.IgpuClock.textContent = igpuClock.toFixed(0) + " MHz";
    DOMElements.IgpuClockBar.style.transform = `scaleX(${igpuClock / maxValues.gpuClock})`;
  } else {
    DOMElements.IgpuClock.textContent = "N/A";
    DOMElements.IgpuClockBar.style.width = "0%";
  }

  const igpuTemp = sensorsData.iGpu?.temperature as number;
  if (igpuTemp != null) {
    DOMElements.igpuTemp.textContent = igpuTemp.toFixed(0) + " °C";
    DOMElements.igpuTempBar.style.transform = `scaleX(${igpuTemp / maxValues.cpuTemp})`;
  } else {
    DOMElements.igpuTemp.textContent = "N/A";
    DOMElements.igpuTempBar.style.width = "0%";
  }

  const igpuVramAllocated = sensorsData.iGpu?.vramAllocated as number;
  const igpuVramAvailable = sensorsData.iGpu?.vramAvailable as number;
  if (igpuVramAllocated != null && igpuVramAvailable != null) {
    DOMElements.igpuVramUsage.textContent = (igpuVramAllocated / 1024).toFixed(1) + " GB";
    DOMElements.igpuVramUsageBar.style.transform = `scaleX(${igpuVramAllocated / (igpuVramAvailable + igpuVramAllocated)})`;
    DOMElements.IvramMax.textContent = ((igpuVramAvailable + igpuVramAllocated) / 1024).toFixed(0) + " GB";
  } else {
    DOMElements.igpuVramUsage.textContent = "N/A";
    DOMElements.igpuVramUsageBar.style.width = "0%";
    DOMElements.IvramMax.textContent = "N/A";
  }

  const igpuPower = sensorsData.iGpu?.power as number;
  DOMElements.igpuPower.textContent = igpuPower != null ? igpuPower.toFixed(0) + " W" : "N/A";
};

const updateRam = (sensorsData: SensorsData) => {
  const memoryUsage = sensorsData.memory?.usage as number;
  const memoryAvailable = sensorsData.memory?.available as number;
  if (memoryUsage != null && memoryAvailable != null) {
    DOMElements.ramUsage.textContent = ((memoryUsage / (memoryAvailable + memoryUsage)) * 100).toFixed(0) + " %";
    DOMElements.ramUsageBar.style.transform = `scaleX(${memoryUsage / (memoryAvailable + memoryUsage)})`;
    DOMElements.ramAvailable.textContent = memoryAvailable.toFixed(0) + " MB";
    DOMElements.ramAvailableBar.style.transform = `scaleX(${memoryAvailable / (memoryAvailable + memoryUsage)})`;
  } else {
    DOMElements.ramUsage.textContent = "N/A";
    DOMElements.ramUsageBar.style.width = "0%";
    DOMElements.ramAvailable.textContent = "N/A";
    DOMElements.ramAvailableBar.style.width = "0%";
  }
};

const updateFans = (sensorsData: SensorsData) => {
  if (sensorsData.fans) {
    for (let i = 0; i < sensorsData.fans.length; i++) {
      const fanSpeed = sensorsData.fans[i] as number;
      const fanLabel = document.getElementById(`fan${i}`) as HTMLParagraphElement;
      const fanBar = document.getElementById(`fan${i}bar`) as HTMLDivElement;

      if (fanLabel) fanLabel.textContent = fanSpeed != null ? fanSpeed.toFixed(0) + " RPM" : "N/A";
      if (fanBar) fanBar.style.transform = fanSpeed != null ? `scaleX(${fanSpeed / maxValues.cpuFan})` : "scaleX(0)";
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE: Disk data cached — update every 30s, not every sensor tick
// ═══════════════════════════════════════════════════════════════════════════════
let cachedDiscData: DiscData | null = null;
let lastDiscUpdate = 0;
const DISC_CACHE_MS = 30000;

const updateDisc = async () => {
  const now = Date.now();
  if (cachedDiscData && (now - lastDiscUpdate) < DISC_CACHE_MS) {
    applyDiscData(cachedDiscData);
    return;
  }
  try {
    const discData = await window.api.getDiscData() as DiscData;
    if (discData && discData["Disk Total [GB]"] && discData["Disk Used [GB]"] && discData["Disk Free [GB]"]) {
      cachedDiscData = discData;
      lastDiscUpdate = now;
      applyDiscData(discData);
    } else {
      showDiscNA();
    }
  } catch (e) {
    showDiscNA();
  }
};

const applyDiscData = (discData: DiscData) => {
  DOMElements.discUsage.textContent = discData["Disk Total [GB]"] + " GB";
  DOMElements.discUsageBar.style.transform = `scaleX(${parseFloat(discData["Disk Used [GB]"]) / parseFloat(discData["Disk Total [GB]"])})`;
  DOMElements.discFree.textContent = discData["Disk Free [GB]"] + " GB";
};

const showDiscNA = () => {
  DOMElements.discUsage.textContent = "N/A";
  DOMElements.discUsageBar.style.transform = "scaleX(0)";
  DOMElements.discFree.textContent = "N/A";
};

// ─── FPS CAPPING ─────────────────────────────────────────────────────────────

const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

let lastFrameTime = 0;
let pendingData: SensorsData | null = null;
let isLoopRunning = false;

const runThrottledUpdate = async (timestamp: number) => {
  isLoopRunning = false;

  const elapsed = timestamp - lastFrameTime;
  if (elapsed < FRAME_INTERVAL) {
    // Not time yet — schedule next check
    requestAnimationFrame(runThrottledUpdate);
    isLoopRunning = true;
    return;
  }

  // Adjust for overshoot to keep timing stable
  lastFrameTime = timestamp - (elapsed % FRAME_INTERVAL);

  if (!pendingData) return;

  // ─── ACTUAL DOM UPDATES ──────────────────────────────────────────────────
  const sensorsData = pendingData;
  pendingData = null;

  try {
    DOMElements.loading.style.display = "none";
    const perCoreView = getPerCoreView();
    if (DOMElements.percoreContainer.style.display !== "flex" && !perCoreView) {
      DOMElements.hardware.style.display = "flex";
    }
    DOMElements.sensorMappingWaiting.style.display = "none";
    DOMElements.sensorError.style.display = "none";
    DOMElements.header.style.display = "flex";

    updateHeader(sensorsData);
    await updateDisc();
    updateCpu(sensorsData);
    updateRam(sensorsData);
    updateFans(sensorsData);
    if (sensorsData.gpu.usage != null) updateDgpu(sensorsData);
    if (sensorsData.iGpu.usage != null) updateIgpu(sensorsData);
  } catch (err) {
    console.error(err);
  }
};

export const updateUi = async (sensorsData: SensorsData) => {
  // PERFORMANCE: Skip expensive updates when tab is hidden
  if (!isVisible) return;

  // Cache the latest data — don't render yet
  pendingData = sensorsData;

  // Kick off the render loop if it's not already running
  if (!isLoopRunning) {
    isLoopRunning = true;
    requestAnimationFrame(runThrottledUpdate);
  }
};


