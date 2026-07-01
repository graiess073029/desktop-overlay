

export interface BackgroundObject {
  path: string,
  type: string,
  poster: string | null
}

export interface ModeObject {
  "gaming": string[],
  "normal": string[],
  "eco": string[]
}

export interface AppObject {
  [key: string]: {
    process: string,
    displayedName: string,
    img: string
  }
}


declare global {
  interface Window {
    api: {
      getSensorsData: () => Promise<SensorsData | null>;
      refreshWindows: () => Promise<void>;
      executeCommand: (command: string) => Promise<void>;
      getAppsData: () => Promise<AppObject | null>;
      getBackgroundsData: () => Promise<BackgroundObject[] | null>;
      getModesData: () => Promise<ModeObject | null>;
      addBackground: (path: string) => Promise<true | Error>;
      pickFile: () => Promise<string | null>;
      readSharedMem: () => Promise<object | null>;
      requestSensorsMapping: () => Promise<object | null>;
      getDiscData: () => Promise<object | null>;
      deleteBackground: (index: number) => Promise<true | Error>;
      deleteApp: (paths: string[]) => Promise<true | Error>;
      addApp: (app: { path: string, displayedName: string }) => Promise<true | Error>;
      pickApp: () => Promise<string | null>;
      getSpecs: () => Promise<object | null>;
      onDiagnosticUpdate: (callback: (data: any) => void) => void;
      onAppAdd: (callback: (data: App) => void) => void;
      imitateDesktop: () => Promise<void>;
      onMappingError: (callback: (data: any) => void) => void;
      onMappingStart: (callback: (data: any) => void) => void;
      onMappingFinished: (callback: (data: any) => void) => void;
    };
  }
}

export interface BgData {
  backgrounds: BackgroundObject[],
  bgSelectedValue: number,
  lenBackgrounds: number,
  bgIndex: number
}

export interface maxValues {
  cpu: {
    load: number,
    temp: number,
    clock: number,
    power: number,
  },

  dgpu: {
    load: number,
    temp: number,
    clock: number,
    power: number,
    vram: number
  } | null,

  igpu: {
    load: number,
    temp: number,
    clock: number,
    power: number,
    vram: number
  } | null,

  ram: number,

  disc: number,

  network: {
    download: number,
    upload: number,
    speed: number,
    ping: number
  },

  fan: { [key: string]: number }
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

export interface Settings { 
  appSize: number | null, 
  fontSize: number | null, 
  overlayOpacity: number | null, 
  textColor: string | null 
}