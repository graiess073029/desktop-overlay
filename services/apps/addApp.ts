import { copyFile, mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import crypto from 'crypto';
import {  exec } from 'child_process';
import { dataFolder, fileExists } from '../exposeDataPath.js';
import { getAppsData } from './getAppsData.js';
import { App } from '../../types.js';
import sharp from 'sharp';
import { promisify } from 'util';
import { BrowserWindow, app as ElectronApp, nativeImage } from 'electron';
import { Dirent } from 'fs';

const execAsync = promisify(exec);

const writeJsonAtomic = async (filePath: string, data: unknown) => {
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await rename(tempPath, filePath);
};

const getDefaultIconPath = async (): Promise<string> => {
  const runtimePath = join(dataFolder, 'assets', 'images', 'icon-fallback.png');
  if (await fileExists(runtimePath)) return runtimePath;

  const bundledPath = ElectronApp.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'assets', 'icon-fallback.jpg')
    : join(__dirname, '..', 'assets', 'icon-fallback.jpg');

  if (await fileExists(bundledPath)) {
    await mkdir(join(dataFolder, 'assets', 'images'), { recursive: true });
    await copyFile(bundledPath, runtimePath);
    return runtimePath;
  }

  return '';
};

const resolveLnkInfo = async (lnkPath: string): Promise<{ extractPath: string; hasCustomIcon: boolean }> => {
  try {
    const escaped = lnkPath.replace(/'/g, "''");
    const res = (await execAsync(
      `powershell -NoProfile -Command "$sh = New-Object -ComObject WScript.Shell; $sc = $sh.CreateShortcut('${escaped}'); Write-Output ($sc.TargetPath + '|' + $sc.IconLocation)"`,
      { encoding: 'utf-8', timeout: 5000 }
  ))

  if (res.stderr) throw new Error(res.stderr);

    const out = res.stdout.trim();


    const [targetPath, iconLocation] = out.split('|');

    if (iconLocation && !iconLocation.startsWith(',')) {
      const iconFile = iconLocation.split(',')[0].trim();
      if (iconFile && await fileExists(iconFile)) {
        return { extractPath: iconFile, hasCustomIcon: true };
      }
    }

    if (targetPath && await fileExists(targetPath)) {
      return { extractPath: targetPath, hasCustomIcon: false };
    }
  } catch { }

  return { extractPath: lnkPath, hasCustomIcon: false };
};

export const runPowerShell = async (
  scriptContent: string,
  label: string
): Promise<string> => {

  const tempScript = join(
    dataFolder,
    `${label}-${Date.now()}-${crypto.randomUUID()}.ps1`
  );

  await writeFile(tempScript, scriptContent, 'utf-8');

  try {
    const { stdout } = await execAsync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScript}"`,
      { timeout: 15000 }
    );

    return stdout.trim();
  } finally {
    await unlink(tempScript).catch(() => {});
  }
};

const extractIcon = async (filePath: string, outputPath: string): Promise<boolean> => {
  const escapedPath = filePath.replace(/'/g, "''");
  const escapedOut = outputPath.replace(/'/g, "''");

  const psScript = `
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
public struct SHFILEINFO {
    public IntPtr hIcon;
    public int iIcon;
    public uint dwAttributes;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
    public string szDisplayName;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 80)]
    public string szTypeName;
}

public class Shell32Util {
    [DllImport("shell32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr SHGetFileInfo(string pszPath, uint dwFileAttributes, ref SHFILEINFO psfi, uint cbSizeFileInfo, uint uFlags);

    [DllImport("shell32.dll")]
    public static extern int SHGetImageList(int iImageList, ref Guid riid, out IntPtr ppvObj);

    [DllImport("comctl32.dll")]
    public static extern IntPtr ImageList_GetIcon(IntPtr himl, int i, int flags);

    [DllImport("user32.dll")]
    public static extern bool DestroyIcon(IntPtr hIcon);
}
"@

function Save-Icon {
    param([IntPtr]\$hIcon, [string]\$outPath)
    \$icon = [System.Drawing.Icon]::FromHandle(\$hIcon)
    \$bitmap = \$icon.ToBitmap()
    \$bitmap.Save(\$outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    \$w = \$bitmap.Width
    \$h = \$bitmap.Height
    \$icon.Dispose()
    \$bitmap.Dispose()
    return "\${w}x\${h}"
}

function Try-ImageList {
    param([string]\$path, [int]\$listId)

    \$guid = [Guid]"46EB5926-582E-4017-9FDF-E8998DAA0950"
    \$iml = [IntPtr]::Zero
    \$hr = [Shell32Util]::SHGetImageList(\$listId, [ref]\$guid, [ref]\$iml)
    if (\$hr -ne 0 -or \$iml -eq [IntPtr]::Zero) { return \$null }

    \$sfi = New-Object SHFILEINFO
    \$SHGFI_SYSICONINDEX = 0x4000
    \$res = [Shell32Util]::SHGetFileInfo(\$path, 0, [ref]\$sfi, [System.Runtime.InteropServices.Marshal]::SizeOf(\$sfi), \$SHGFI_SYSICONINDEX)
    if (\$res -eq [IntPtr]::Zero) { return \$null }

    \$hIcon = [Shell32Util]::ImageList_GetIcon(\$iml, \$sfi.iIcon, 1)
    if (\$hIcon -eq [IntPtr]::Zero) { return \$null }

    try {
        return Save-Icon -hIcon \$hIcon -outPath \$using_outPath
    } finally {
        [Shell32Util]::DestroyIcon(\$hIcon) | Out-Null
    }
}

function Try-FileInfoLargeIcon {
    param([string]\$path)

    \$sfi = New-Object SHFILEINFO
    \$SHGFI_ICON = 0x100
    \$SHGFI_LARGEICON = 0x0
    \$res = [Shell32Util]::SHGetFileInfo(\$path, 0, [ref]\$sfi, [System.Runtime.InteropServices.Marshal]::SizeOf(\$sfi), (\$SHGFI_ICON -bor \$SHGFI_LARGEICON))
    if (\$res -eq [IntPtr]::Zero -or \$sfi.hIcon -eq [IntPtr]::Zero) { return \$null }

    try {
        return Save-Icon -hIcon \$sfi.hIcon -outPath \$using_outPath
    } finally {
        [Shell32Util]::DestroyIcon(\$sfi.hIcon) | Out-Null
    }
}

\$path = '${escapedPath}'
\$using_outPath = '${escapedOut}'

\$dims = $null
\$source = ""

foreach (\$entry in @(@(0x4,"JUMBO"), @(0x2,"EXTRALARGE"), @(0x0,"LARGE"))) {
    try {
        \$dims = Try-ImageList -path \$path -listId \$entry[0]
    } catch {
        \$dims = \$null
    }
    if (\$dims) { \$source = "IMAGELIST_\$($entry[1])"; break }
}

if (-not \$dims) {
    try {
        \$dims = Try-FileInfoLargeIcon -path \$path
        if (\$dims) { \$source = "FILEINFO_LARGE" }
    } catch {
        \$dims = \$null
    }
}

if (\$dims) {
    Write-Output "OK:\${dims}:\${source}"
} else {
    Write-Output "FAIL:NO_ICON_AVAILABLE"
}
`;

  try {
    const out = await runPowerShell(psScript, 'icon');
    const success =  out.startsWith('OK')
      && await fileExists(outputPath)
      && (await stat(outputPath)).size > 200;

    if (success) {
      console.log(`[DEBUG] extractIcon: ${out} for ${filePath}`);
    } else {
      console.log(`[DEBUG] extractIcon failed for ${filePath}: "${out}"`);
    }

    if (!success && await fileExists(outputPath)) {
      try { await unlink(outputPath); } catch { }
    }
    return success;
  } catch (err) {
    console.log('[DEBUG] extractIcon error:', err);
    return false;
  }
};

const extractAssociatedIcon = async (filePath: string, outputPath: string): Promise<boolean> => {
  const escaped = filePath.replace(/'/g, "''");
  const escapedOut = outputPath.replace(/'/g, "''");

  const psScript = `
Add-Type -AssemblyName System.Drawing
try {
    \$icon = [System.Drawing.Icon]::ExtractAssociatedIcon('${escaped}')
    if (\$icon) {
        \$bitmap = \$icon.ToBitmap()
        \$bitmap.Save('${escapedOut}', [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Output "OK:\$($bitmap.Width)x\$($bitmap.Height)"
        \$icon.Dispose()
        \$bitmap.Dispose()
    } else {
        Write-Output "FAIL:NULL_ICON"
    }
} catch {
    Write-Output "FAIL:EXCEPTION:\$(\$_.Exception.Message)"
}
`;

  try {
    const out = await runPowerShell(psScript, 'assoc-icon');
    const success = out.startsWith('OK')
      && await fileExists(outputPath)
      && (await stat(outputPath)).size > 200;

    if (success) {
      console.log(`[DEBUG] extractAssociatedIcon: ${out} for ${filePath}`);
    } else {
      console.log(`[DEBUG] extractAssociatedIcon failed for ${filePath}: "${out}"`);
    }

    if (!success && await fileExists(outputPath)) {
      try { await unlink(outputPath); } catch { }
    }
    return success;
  } catch (err) {
    console.log('[DEBUG] extractAssociatedIcon error:', err);
    return false;
  }
};

const getActualSize = async (p: string): Promise<{ w: number; h: number }> => {
  try {
    const img = await readFile(p);
    if (img[1] === 0x50 && img[2] === 0x4e && img[3] === 0x47) {
      const w = img.readUInt32BE(16);
      const h = img.readUInt32BE(20);
      return { w, h };
    }
  } catch { }
  return { w: 0, h: 0 };
};

// ============================================================================
// NORMALIZE ICON SIZE — Full debug logging
// ============================================================================

const normalizeIconSize = async (
  filePath: string,
  targetWidth = 64,
  targetHeight = targetWidth,
  // Fraction of the output canvas that the icon's content (its longest
  // side) should occupy. ~0.8 matches how most well-designed app icons
  // look (logo + a modest breathing-room margin). Normalizing every icon
  // to this SAME ratio is the key fix: icons with too little padding
  // (NVIDIA App) get more added, icons with way too much padding
  // (AQIRYS, MSI Afterburner) get cropped down and scaled up — instead of
  // a margin-size threshold that only handled one direction correctly.
  contentFillRatio = 0.8
): Promise<boolean> => {
  console.log(`[DEBUG] normalizeIconSize START: ${filePath}, target=${targetWidth}x${targetHeight}, fillRatio=${contentFillRatio}`);

  try {
    if (!await fileExists(filePath)) {
      console.log(`[DEBUG] File does not exist: ${filePath}`);
      return false;
    }

    const image = nativeImage.createFromPath(filePath);
    if (image.isEmpty()) {
      console.log(`[DEBUG] nativeImage reports empty, aborting`);
      return false;
    }

    const { width: w, height: h } = image.getSize();
    console.log(`[DEBUG] Source size: ${w}x${h}`);

    // Find the bounding box of non-transparent content.
    // Only alpha counts as "empty" — color (including black) is real content,
    // so black-background badges (like NVIDIA's) aren't mistaken for padding.
    const { data, info } = await sharp(filePath)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const { width: rw, height: rh, channels } = info;
    let minX = rw, maxX = -1, minY = rh, maxY = -1;

    for (let y = 0; y < rh; y++) {
      for (let x = 0; x < rw; x++) {
        const a = data[(y * rw + x) * channels + 3];
        if (a >= 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const hasContent = maxX >= minX && maxY >= minY;
    let outputBuffer: Buffer;

    if (!hasContent) {
      // Fully transparent image — nothing to anchor on, just scale the canvas.
      console.log(`[DEBUG] No non-transparent content found, doing plain resize`);
      outputBuffer = await sharp(filePath)
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
    } else {
      const contentW = maxX - minX + 1;
      const contentH = maxY - minY + 1;
      const centerX = (minX + maxX + 1) / 2;
      const centerY = (minY + maxY + 1) / 2;

      console.log(`[DEBUG] Content bbox: ${contentW}x${contentH} centered at (${centerX.toFixed(1)}, ${centerY.toFixed(1)}) within ${w}x${h}`);

      // Size of a square crop, centered on the content, such that the
      // content's longest side occupies exactly `contentFillRatio` of it.
      //   - Content already filling most of the canvas (small native
      //     margin, e.g. NVIDIA) -> cropSize comes out LARGER than the
      //     source canvas -> we pad outward with transparency.
      //   - Content that's tiny inside an oversized canvas (e.g. AQIRYS,
      //     MSI Afterburner) -> cropSize comes out much SMALLER than the
      //     source canvas -> we crop the dead space away.
      const cropSize = Math.max(contentW, contentH) / contentFillRatio;

      console.log(`[DEBUG] Target crop size: ${cropSize.toFixed(1)}x${cropSize.toFixed(1)} (fill ratio ${contentFillRatio})`);

      // Stage the original image on a transparent canvas big enough to
      // contain both itself AND the crop box wherever it lands, so we
      // never try to extract pixels outside the available area.
      const stageSize = Math.ceil(Math.max(cropSize, w, h)) + 4;
      const stageLeft = Math.round((stageSize - w) / 2);
      const stageTop = Math.round((stageSize - h) / 2);

      const staged = await sharp({
        create: {
          width: stageSize,
          height: stageSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([{ input: await sharp(filePath).png().toBuffer(), left: stageLeft, top: stageTop }])
        .png()
        .toBuffer();

      const cropSizeInt = Math.round(cropSize);
      const cropLeft = Math.max(0, Math.min(
        stageSize - cropSizeInt,
        Math.round(stageLeft + centerX - cropSize / 2)
      ));
      const cropTop = Math.max(0, Math.min(
        stageSize - cropSizeInt,
        Math.round(stageTop + centerY - cropSize / 2)
      ));

      console.log(`[DEBUG] Extracting ${cropSizeInt}x${cropSizeInt} from staged canvas at (${cropLeft}, ${cropTop})`);

      outputBuffer = await sharp(staged)
        .extract({ left: cropLeft, top: cropTop, width: cropSizeInt, height: cropSizeInt })
        .resize(targetWidth, targetHeight, {
          fit: 'fill', // crop is already square and centered on content, so no distortion
          kernel: sharp.kernel.lanczos3,
        })
        .png()
        .toBuffer();
    }

    const outputMeta = await sharp(outputBuffer).metadata();
    console.log(`[DEBUG] Output metadata: ${outputMeta.width}x${outputMeta.height}, format=${outputMeta.format}`);

    // Write atomically
    const tmp = `${filePath}.resize.tmp`;
    await writeFile(tmp, outputBuffer);
    await rename(tmp, filePath);

    const verifySize = await getActualSize(filePath);
    console.log(`[DEBUG] Final file on disk: ${verifySize.w}x${verifySize.h}`);

    console.log(`[DEBUG] normalizeIconSize SUCCESS: ${filePath}`);
    return true;
  } catch (err) {
    console.log(`[DEBUG] normalizeIconSize ERROR for ${filePath}:`, err);
    return false;
  }
};

// ============================================================================
// ADD APP — Full debug logging
// ============================================================================

export const addApp = async (app: { path: string; displayedName: string }) => {
  try {
    console.log(`[DEBUG] addApp START: "${app.displayedName}", path=${app.path}`);

    const apps = await getAppsData();
    console.log(`[DEBUG] Current app count: ${Object.keys(apps).length}`);

    const exists = Object.values(apps).some((a: any) => a.process === app.path);
    if (exists) {
      console.log(`[DEBUG] App already exists, skipping`);
      return;
    }

    if (!await fileExists(app.path)) {
      console.log(`[DEBUG] App path does not exist: ${app.path}`);
      return;
    }

    const uuid = crypto.randomUUID();
    const iconsDir = join(dataFolder, 'assets', 'images', 'appsIcons');
    await mkdir(iconsDir, { recursive: true });

    let iconPath = '';
    const finalPath = join(iconsDir, `${uuid}.png`);
    const ICON_SIZE = 64;

    console.log(`[DEBUG] Will save icon to: ${finalPath}`);

    let extractPath = app.path;

    // Step 1: SHGetImageList
    console.log(`[DEBUG] Step 1: extractIcon(${extractPath})`);
    if (await extractIcon(extractPath, finalPath)) {
      iconPath = finalPath;
      console.log(`[DEBUG] Step 1 SUCCESS: icon at ${iconPath}`);
    } else {
      console.log(`[DEBUG] Step 1 FAILED`);
    }

    // Step 2: Check size, try Electron getFileIcon if too small
    if (iconPath) {
      const { w, h } = await getActualSize(iconPath);
      console.log(`[DEBUG] Step 2: Checking icon size: ${w}x${h}`);

      if (w < ICON_SIZE || h < ICON_SIZE) {
        console.log(`[DEBUG] Icon too small (${w}x${h}), trying Electron getFileIcon`);
        try {
          const icon = await ElectronApp.getFileIcon(extractPath, { size: 'large' });
          const png = icon.toPNG();
          console.log(`[DEBUG] Electron getFileIcon returned: ${png?.length ?? 0} bytes`);

          if (png && png.length > 200) {
            const electronTmp = finalPath + '.etmp.png';
            await writeFile(electronTmp, png);
            const { w: ew, h: eh } = await getActualSize(electronTmp);
            console.log(`[DEBUG] Electron icon size: ${ew}x${eh}`);

            if (ew >= w && eh >= h) {
              await rename(electronTmp, finalPath);
              iconPath = finalPath;
              console.log(`[DEBUG] Electron icon accepted and replaced PS result`);
            } else {
              try { await unlink(electronTmp); } catch { }
              console.log(`[DEBUG] Electron icon rejected (not larger)`);
            }
          }
        } catch (e) {
          console.log(`[DEBUG] Electron getFileIcon failed: ${e}`);
        }
      }
    }

    // Step 3: ExtractAssociatedIcon fallback
    if (!iconPath) {
      console.log(`[DEBUG] Step 3: extractAssociatedIcon(${extractPath})`);
      if (await extractAssociatedIcon(extractPath, finalPath)) {
        iconPath = finalPath;
        console.log(`[DEBUG] Step 3 SUCCESS`);
      } else {
        console.log(`[DEBUG] Step 3 FAILED`);
      }
    }

    // Step 4: Electron getFileIcon fallback
    if (!iconPath) {
      console.log(`[DEBUG] Step 4: Electron getFileIcon fallback`);
      try {
        const icon = await ElectronApp.getFileIcon(extractPath, { size: 'large' });
        const png = icon.toPNG();
        console.log(`[DEBUG] Electron fallback returned: ${png?.length ?? 0} bytes`);

        if (png && png.length > 200) {
          await writeFile(finalPath, png);
          iconPath = finalPath;
          console.log(`[DEBUG] Step 4 SUCCESS`);
        }
      } catch (e) {
        console.log(`[DEBUG] Step 4 FAILED: ${e}`);
      }
    }

    // Step 5: Default fallback
    if (!iconPath) {
      iconPath = await getDefaultIconPath();
      console.log(`[DEBUG] Step 5: Using default icon: ${iconPath}`);
    }

    // Normalize
    if (iconPath === finalPath) {
      console.log(`[DEBUG] Normalizing icon at ${iconPath}`);
      const normalized = await normalizeIconSize(iconPath, ICON_SIZE);
      console.log(`[DEBUG] normalizeIconSize result: ${normalized}`);
    } else {
      console.log(`[DEBUG] Skipping normalize (iconPath=${iconPath}, finalPath=${finalPath})`);
    }

    const { w: finalW, h: finalH } = await getActualSize(iconPath === finalPath ? iconPath : '');
    console.log(`[DEBUG] Final icon dimensions: ${finalW}x${finalH}`);

    const newApp: App = {
      process: app.path,
      img: iconPath,
      displayedName: app.displayedName,
    };

    const updatedApps = { ...apps, [app.displayedName]: newApp };
    await writeJsonAtomic(join(dataFolder, 'data.json'), updatedApps);
    console.log(`[DEBUG] App saved: "${app.displayedName}"`);

    BrowserWindow.getAllWindows().forEach((win) => {
      try {
        if (win.getBounds().x === 0 && win.getBounds().y === 0) {
          win.webContents.send('add-app', newApp);
        }
      } catch (err) {
        console.error('Error sending add-app event to window:', err);
      }
    });

    console.log(`[DEBUG] addApp END: "${app.displayedName}"`);
  } catch (err) {
    console.error('Error in addApp:', err);
    throw err;
  }
};

// ============================================================================
// READ DESKTOP — Full debug logging
// ============================================================================

export const readDesktop = async () => {
  try {
    console.log(`[DEBUG] readDesktop START`);

    await writeJsonAtomic(join(dataFolder, 'data.json'), {});
    console.log(`[DEBUG] Cleared existing apps`);

    const userDesktopPath = ElectronApp.getPath('desktop');
    const publicDesktopPath = join(process.env.PUBLIC || 'C:\\Users\\Public', 'Desktop');

    console.log(`[DEBUG] userDesktop=${userDesktopPath}`);
    console.log(`[DEBUG] publicDesktop=${publicDesktopPath}`);

    const [userItems, publicItems] = await Promise.all([
      readdir(userDesktopPath, { withFileTypes: true }).catch((e) => {
        console.log(`[DEBUG] Failed to read user desktop: ${e}`);
        return [] as Dirent[];
      }),
      readdir(publicDesktopPath, { withFileTypes: true }).catch((e) => {
        console.log(`[DEBUG] Failed to read public desktop: ${e}`);
        return [] as Dirent[];
      }),
    ]);

    console.log(`[DEBUG] userItems=${userItems.length}, publicItems=${publicItems.length}`);

    const seen = new Set<string>();
    const items = [...userItems, ...publicItems].filter((item) => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });

    console.log(`[DEBUG] Unique items to process: ${items.length}`);

    let processed = 0;
    for (const item of items) {
      try {
        if (!item.isFile()) {
          console.log(`[DEBUG] Skipping non-file: ${item.name}`);
          continue;
        }
        if (item.name === 'desktop.ini') continue;
        if (item.name.startsWith('.')) continue;

        const appPath = item.parentPath === publicDesktopPath
          ? join(publicDesktopPath, item.name)
          : join(userDesktopPath, item.name);

        const displayedName = basename(item.name, extname(item.name));
        console.log(`[DEBUG] Processing [${++processed}/${items.length}]: ${displayedName}`);

        await addApp({ path: appPath, displayedName });
        await new Promise((r) => setTimeout(r, 150));
      } catch (itemErr) {
        console.error(`Error processing desktop item ${item.name}:`, itemErr);
      }
    }

    console.log(`[DEBUG] readDesktop END: processed ${processed} items`);
  } catch (err) {
    console.error('Error in readDesktop:', err);
    throw err;
  }
};

// ============================================================================
// MIGRATE SMALL ICONS — Full debug logging
// ============================================================================

export const migrateSmallIcons = async (targetSize: number = 64): Promise<void> => {
  console.log(`[DEBUG] migrateSmallIcons START, targetSize=${targetSize}`);

  const apps = await getAppsData() as Record<string, App>;
  console.log(`[DEBUG] Checking ${Object.keys(apps).length} apps`);

  let checked = 0, migrated = 0, skipped = 0;

  for (const [name, entry] of Object.entries(apps)) {
    checked++;
    const iconPath = entry.img;

    if (!iconPath || !await fileExists(iconPath) || !iconPath.endsWith('.png')) {
      console.log(`[DEBUG] [${checked}] "${name}": skipping (no valid icon path)`);
      skipped++;
      continue;
    }

    const { w, h } = await getActualSize(iconPath);
    console.log(`[DEBUG] [${checked}] "${name}": current size ${w}x${h}`);

    if (w >= targetSize && h >= targetSize) {
      console.log(`[DEBUG] [${checked}] "${name}": already adequate, skipping`);
      skipped++;
      continue;
    }

    console.log(`[DEBUG] [${checked}] "${name}": MIGRATING (too small)`);
    migrated++;

    try { await unlink(iconPath); } catch { }

    const ext = extname(entry.process).toLowerCase();
    let extractPath = entry.process;
    if (ext === '.lnk') {
      const { extractPath: resolved } = await resolveLnkInfo(entry.process);
      extractPath = resolved;
    }

    let success = await extractIcon(extractPath, iconPath);
    console.log(`[DEBUG] [${checked}] "${name}": extractIcon success=${success}`);

    if (success) {
      const { w: pw, h: ph } = await getActualSize(iconPath);
      console.log(`[DEBUG] [${checked}] "${name}": post-extract size ${pw}x${ph}`);

      if (pw < targetSize || ph < targetSize) {
        console.log(`[DEBUG] [${checked}] "${name}": still small, trying Electron`);
        try {
          const icon = await ElectronApp.getFileIcon(extractPath, { size: 'large' });
          const png = icon.toPNG();
          if (png && png.length > 200) {
            await writeFile(iconPath, png);
            console.log(`[DEBUG] [${checked}] "${name}": Electron wrote ${png.length} bytes`);
          }
        } catch (e) {
          console.log(`[DEBUG] [${checked}] "${name}": Electron failed: ${e}`);
        }
      }
    }

    if (!success) {
      success = await extractAssociatedIcon(extractPath, iconPath);
      console.log(`[DEBUG] [${checked}] "${name}": extractAssociatedIcon success=${success}`);
    }

    if (!success) {
      try {
        const icon = await ElectronApp.getFileIcon(extractPath, { size: 'large' });
        const png = icon.toPNG();
        if (png && png.length > 200) {
          await writeFile(iconPath, png);
          success = true;
          console.log(`[DEBUG] [${checked}] "${name}": Electron fallback succeeded`);
        }
      } catch (e) {
        console.log(`[DEBUG] [${checked}] "${name}": Electron fallback failed: ${e}`);
      }
    }

    if (success) {
      await normalizeIconSize(iconPath, targetSize);
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`[DEBUG] migrateSmallIcons END: checked=${checked}, migrated=${migrated}, skipped=${skipped}`);
};