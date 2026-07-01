import { createHWiNFOReader, HWiNFOSnapshot } from "hwinfo-reader"
import { BrowserWindow } from "electron";
import { LabelMapping, SensorsData } from "../../types";
import { sensorMappingRAMCache } from "./sensorMapper";

let temp: HWiNFOSnapshot | null = null;
let tempIndex: Map<string, number> | null = null;
let lastUpdate: bigint | null = null;

const reader = createHWiNFOReader();

export const getLatestData = async (): Promise<SensorsData | null> => {
    try {

        const sensorsMap = sensorMappingRAMCache;
        if (!sensorsMap || !temp) return null;

        const index = buildSensorIndex(temp);
        const dataToSend = parseSensors(index, sensorsMap);

        BrowserWindow.getAllWindows().forEach((win) => {
            win.webContents.send("monitoringData", dataToSend);
        });

        return dataToSend;
    } catch (err) {
        console.error((err as Error).message);
        return null;
    }
};

const parseSensors = (
    index: Map<string, number>,
    sensorsMap: LabelMapping
): SensorsData => {
    const get = (label?: string, id?: number): number | null =>
        getValue(index, label, id);

    const memoryUsage = get(sensorsMap.memory.usage?.labelOriginal, sensorsMap.memory.usage?.sensorId);
    const memoryAvailable = get(sensorsMap.memory.available?.labelOriginal, sensorsMap.memory.available?.sensorId);
    const iGpuVramAllocated = get(sensorsMap.iGpu.vramAllocated?.labelOriginal, sensorsMap.iGpu.vramAllocated?.sensorId);

    return {
        cpu: {
            usage: get(sensorsMap.cpu.usage?.labelOriginal, sensorsMap.cpu.usage?.sensorId),
            clock: get(sensorsMap.cpu.clock?.labelOriginal, sensorsMap.cpu.clock?.sensorId),
            temperature: get(sensorsMap.cpu.temperature?.labelOriginal, sensorsMap.cpu.temperature?.sensorId),
            voltage: get(sensorsMap.cpu.voltage?.labelOriginal, sensorsMap.cpu.voltage?.sensorId),
            power: get(sensorsMap.cpu.power?.labelOriginal, sensorsMap.cpu.power?.sensorId),
            cores: sensorsMap.cpu.cores.map((core: any) => {
                const usageValues = core.usageSensors
                    .map((sensor: any) => get(sensor.labelOriginal, sensor.sensorId))
                    .filter((v: number | null): v is number => v !== null && !Number.isNaN(v));

                return {
                    usage: usageValues.length > 0
                        ? usageValues.reduce((a: number, b: number) => a + b, 0) / usageValues.length
                        : null,
                    clock: get(core.clockSensor?.labelOriginal, core.clockSensor?.sensorId),
                    temperature: get(core.temperatureSensor?.labelOriginal, core.temperatureSensor?.sensorId),
                };
            }),
        },
        gpu: {
            usage: get(sensorsMap.gpu.usage?.labelOriginal, sensorsMap.gpu.usage?.sensorId),
            clock: get(sensorsMap.gpu.clock?.labelOriginal, sensorsMap.gpu.clock?.sensorId),
            temperature: get(sensorsMap.gpu.temperature?.labelOriginal, sensorsMap.gpu.temperature?.sensorId),
            power: get(sensorsMap.gpu.power?.labelOriginal, sensorsMap.gpu.power?.sensorId),
            vramAllocated: get(sensorsMap.gpu.vramAllocated?.labelOriginal, sensorsMap.gpu.vramAllocated?.sensorId),
            vramAvailable: get(sensorsMap.gpu.vramAvailable?.labelOriginal, sensorsMap.gpu.vramAvailable?.sensorId),
        },
        iGpu: {
            usage: get(sensorsMap.iGpu.usage?.labelOriginal, sensorsMap.iGpu.usage?.sensorId),
            clock: get(sensorsMap.iGpu.clock?.labelOriginal, sensorsMap.iGpu.clock?.sensorId),
            temperature: get(sensorsMap.iGpu.temperature?.labelOriginal, sensorsMap.iGpu.temperature?.sensorId),
            power: get(sensorsMap.iGpu.power?.labelOriginal, sensorsMap.iGpu.power?.sensorId),
            vramAllocated: iGpuVramAllocated,
            vramAvailable: (memoryUsage !== null && memoryAvailable !== null && iGpuVramAllocated !== null)
                ? ((memoryUsage + memoryAvailable) / 2) - iGpuVramAllocated
                : null,
        },
        memory: {
            usage: memoryUsage,
            available: memoryAvailable,
        },
        fans: sensorsMap.fans.map((fan: any) => get(fan.labelOriginal, fan.sensorId) as number | null),
        battery: {
            level: get(sensorsMap.battery.level?.labelOriginal, sensorsMap.battery.level?.sensorId),
            chargeRate: get(sensorsMap.battery.chargeRate?.labelOriginal, sensorsMap.battery.chargeRate?.sensorId),
        },
    };
};

export const sharedMemReader = async (): Promise<HWiNFOSnapshot | null> => {
    try {
        const data = reader.read();
        if (data) {
            temp = data;
            return data;
        }
        throw new Error("No data read from shared memory");
    } catch (err) {
        console.error("sharedMemReader error:", err);
        return null;
    }
};

export const buildSensorIndex = (sensorsData: HWiNFOSnapshot | null): Map<string, number> => {
    if (!sensorsData) {
        return tempIndex ?? new Map();
    }

    if (sensorsData.lastUpdate === lastUpdate && tempIndex) {
        return tempIndex;
    }

    const index = new Map<string, number>();
    for (const sensor of sensorsData.sensors) {
        for (const reading of sensor.readings) {
            const key = `${sensor.sensorId}|${reading.labelOriginal}`;
            index.set(key, reading.value);
        }
    }

    lastUpdate = sensorsData.lastUpdate as bigint;
    tempIndex = index;
    return index;
};

export const getValue = (
    index: Map<string, number>,
    sensorLabel: string | undefined,
    sensorId: number | undefined
): number | null => {
    if (sensorLabel === undefined || sensorId === undefined) return null;
    const key = `${sensorId}|${sensorLabel}`;
    const value = index.get(key);
    return value !== undefined ? value : null;
};

export const getDataSample = () => temp;