import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  
  getSensorsData: () => ipcRenderer.invoke('get-sensor-data'),

  refreshWindows: () => ipcRenderer.send('refresh-windows'),

  executeCommand: (command : string) => ipcRenderer.invoke('execute-command', command),

  getAppsData: () => ipcRenderer.invoke('get-apps-data'),

  getBackgroundsData: () => ipcRenderer.invoke('get-backgrounds-data'),

  getModesData: () => ipcRenderer.invoke('get-modes-data'),

  addBackground : (path : string) => ipcRenderer.invoke('add-background',path),

  pickFile : () => ipcRenderer.invoke('pick-file'),

  pickApp : () => ipcRenderer.invoke('pick-app'),

  readSharedMem : () => ipcRenderer.invoke('get-readings'),

  requestSensorsMapping : () => ipcRenderer.invoke('request-sensors-mapping'),

  getDiscData : () => ipcRenderer.invoke('get-disc-data'),

  deleteApp : (paths : string[]) => ipcRenderer.invoke('delete-app', paths),

  deleteBackground : (index : number) => ipcRenderer.invoke('delete-background', index),

  getSpecs : () => ipcRenderer.invoke('get-specs'),

  addApp : (app : {path : string, displayedName : string}) => ipcRenderer.invoke('add-app', app),

  onDiagnosticUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('monitoringData', (_event, value) => callback(value));
  },

  onAppAdd : (callback: (data: any) => void) => {
    ipcRenderer.on('add-app', (_event, value) => callback(value));
  },

  imitateDesktop : () => ipcRenderer.invoke('imitate-desktop'),

  onMappingError : (callback: (data: any) => void) => {
    ipcRenderer.on('mapping-error', (_event, value) => callback(value));
  },

  onMappingStart : (callback: (data: any) => void) => {
    ipcRenderer.on('mapping-start', (_event, value) => callback(value));
  },

  onMappingFinished : (callback: (data: any) => void) => {
    ipcRenderer.on('mapping-finished', (_event, value) => callback(value));
  },

});