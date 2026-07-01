

export interface DiscData {
  "Disk Total [GB]": string;
  "Disk Free [GB]": string;
  "Disk Used [GB]": string;
}

export interface App {
  process: string;
  img: string;
  displayedName: string
}


export interface AppsData {
  [appName: string]: App;
}

export interface SensorsData {
  cpu: {
    usage: number | null;
    clock: number | null;
    temperature: number | null;
    voltage: number | null;
    power: number | null;
    cores: {
      usage: number | null;
      clock: number | null;
      temperature: number | null;
    }[];
  };
  gpu: {
    usage: number | null;
    clock: number | null;
    temperature: number | null;
    power: number | null;
    vramAllocated: number | null;
    vramAvailable: number | null;
  };
  iGpu: {
    usage: number | null;
    clock: number | null;
    temperature: number | null;
    power: number | null;
    vramAllocated: number | null;
    vramAvailable: number | null;
  };
  memory: {
    usage: number | null;
    available: number | null;
  };
  fans: (number | null)[];
  battery: {
    level: number | null;
    chargeRate: number | null;
  };
}


export interface SensorCandidate {
  index: number;
  label: string;
  unit: string;
  type: string;
  group: string;
  sensorId: number;
}

export interface RawReading {
  index: number;
  readingId: number;
  labelOriginal: string;
  unit: string;
  readingType: string;
  value: number;
}

export interface RawSensor {
  nameOriginal: string;
  sensorId: number;
  readings: RawReading[];
}

export interface RawSensorsFile {
  sensors: RawSensor[];
  readings: RawReading[];
}

export interface SensorMapping {
  sensorId: number;
  labelOriginal: string;
}

export interface LabelMapping {
  cpu: {
    usage: SensorMapping | null;
    clock: SensorMapping | null;
    temperature: SensorMapping | null;
    voltage: SensorMapping | null;
    power: SensorMapping | null;
    cores: {
      name: string;
      type: "performance" | "efficiency" | "standard";
      usageSensors: SensorMapping[];
      clockSensor: SensorMapping | null;
      temperatureSensor: SensorMapping | null;
    }[];
  };
  gpu: {
    usage: SensorMapping | null;
    clock: SensorMapping | null;
    temperature: SensorMapping | null;
    power: SensorMapping | null;
    vramAllocated: SensorMapping | null;
    vramAvailable: SensorMapping | null;
  };
  iGpu: {
    usage: SensorMapping | null;
    clock: SensorMapping | null;
    temperature: SensorMapping | null;
    power: SensorMapping | null;
    vramAllocated: SensorMapping | null;
  };
  memory: {
    usage: SensorMapping | null;
    available: SensorMapping | null;
  };
  fans: {
    name: string;
    sensorId: number;
    labelOriginal: string;
  }[];
  battery: {
    level: SensorMapping | null;
    chargeRate: SensorMapping | null;
  };
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface BackgroundObject {
  path: string,
  type: string,
  poster: string | null
}

export interface ServerResponse {
  state: "success" | "error",
  message: string,
  data: LabelMapping
}