import { randomUUID } from "crypto";
import { join } from "path";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { bgDataFolder, bgDataPath, getBackgroundsData } from './getBackgroundsData';
import { fileExists } from "../exposeDataPath";

const dataFolder = path.join(app.getPath('userData'), 'data');

const getAssetPath = (...segments: string[]): string => {
  const base = app.isPackaged 
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'dist')
    : path.join(__dirname, '..', '..');
  return path.join(base, ...segments);
};

export const addDefaultBackground = async () => {
  try {
    const backgrounds = await getBackgroundsData();
    const sourcePath = getAssetPath('assets', 'wallpaper.jpeg');
    const bgNewPath = path.join(bgDataFolder, 'static', 'wallpaper.jpeg');

    console.log('Source:', sourcePath, 'exists?', await fileExists(sourcePath));

    await fs.mkdir(path.dirname(bgNewPath), { recursive: true });

    if (!await fileExists(bgNewPath) && await fileExists(sourcePath)) {
      await fs.copyFile(sourcePath, bgNewPath);
    }

    if (backgrounds && !backgrounds.some((bg: any) => bg.path.includes('wallpaper.jpeg'))) {
      backgrounds.push({ path: bgNewPath, type: 'image' });
      await fs.writeFile(bgDataPath, JSON.stringify(backgrounds));
    }
  } catch (err) {
    console.error('Failed to add default background:', err);
  }
};

ffmpeg.setFfmpegPath(ffmpegPath!);

const extensions = {
    images: ["jpg", "jpeg", "png", "webp"],
    videos: ["mp4", "webm"]
}

const postersFolderPath = join(bgDataFolder, "posters")

export const addBackground = async (path: string) => {
    try {
        let backgrounds = await getBackgroundsData();

        const fileName = randomUUID()
        const extension = path.split('.').pop()?.toLowerCase();

        if (!extension) {
            throw new Error("File has no extension");
        }

        if (!await fileExists(path)) {
            throw new Error("File not found: " + path);
        }

        let object: { path: string, type: "image" | "video", poster?: string } = { path: "", type: "image" };

        if (extensions.images.includes(extension)) {
            const bgNewPath = join(bgDataFolder, "static", `${fileName}.${extension}`)
            await fs.copyFile(path, bgNewPath);
            object = { path: bgNewPath, type: "image" }

        }
        else if (extensions.videos.includes(extension)) {

            const bgNewPath = join(bgDataFolder, "animated", `${fileName}.mp4`)

            await new Promise<void>((resolve, reject) => {
                ffmpeg(path)
                    .outputOptions([
                        '-vf', 'fps=60,scale=1280:-2',
                        '-c:v', 'libx264',
                        '-profile:v', 'high',
                        '-pix_fmt', 'yuv420p',
                        '-preset', 'medium',
                        '-crf', '26',
                        '-g', '48',
                        '-movflags', '+faststart',
                        '-an'
                    ])
                    .output(bgNewPath)
                    .on('end', () => resolve())
                    .on('error', reject)
                    .run()
            });

            const poster = await new Promise<string>((resolve, reject) => {
                ffmpeg(path)
                    .screenshots({
                        count: 1,
                        timestamps: ['00:00:03'],
                        filename: `${fileName}.png`,
                        folder: postersFolderPath
                    })
                    .on('end', () => resolve(join(postersFolderPath, `${fileName}.png`)))
                    .on('error', reject);
            });

            object = { path: bgNewPath, type: "video", poster }

        }

        else {
            throw new Error(`Invalid file type: .${extension}`);
        }

        if (!backgrounds) {
            throw new Error("Couldn't fetch backgrounds data");
        }

        backgrounds.push(object);
        await fs.writeFile(bgDataPath, JSON.stringify(backgrounds));

    } catch (err) {
        console.error('Error adding background:', err);
        throw err;
    }
}
