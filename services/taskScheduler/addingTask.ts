import { execSync } from "child_process";
import { app } from "electron";
import path from "path";



export const addToTaskScheduler = () => {
  const exePath = app.isPackaged
    ? process.execPath
    : path.join(__dirname, '..', 'node_modules', '.bin', 'electron.cmd');

  const taskName = 'DesktopOverlayStartup';

  // Supprimer la tâche existante si présente
  try {
    execSync(`sudo schtasks /delete /tn "${taskName}" /f`, { windowsHide: true });
  } catch {
    // ignore si n'existe pas
  }

  // Créer la nouvelle tâche
  const psScript = `
$action = New-ScheduledTaskAction -Execute "${exePath.replace(/"/g, '\\"')}"
$trigger = New-ScheduledTaskTrigger -AtLogon
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -RunLevel Highest
Register-ScheduledTask -TaskName "${taskName}" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
`;

  const tempScript = path.join(app.getPath('temp'), 'add-task.ps1');
  require('fs').writeFileSync(tempScript, psScript, 'utf-8');

  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScript}"`, {
      encoding: 'utf-8',
      timeout: 15000,
      windowsHide: true
    });
    console.log('Tâche planifiée créée avec succès');
  } catch (err) {
    console.error('Échec création tâche planifiée:', err);
  } finally {
    try { require('fs').unlinkSync(tempScript); } catch { }
  }
}; 