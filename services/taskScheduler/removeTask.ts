import { execSync } from "child_process";

export const removeFromTaskScheduler = () => {
  try {
    execSync(`schtasks /delete /tn "DesktopOverlayStartup" /f`, { windowsHide: true });
    console.log('Tâche planifiée supprimée');
  } catch {
    // ignore
  }
};