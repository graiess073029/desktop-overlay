import { randomUUID } from "crypto";
import { join } from "path";
import ffmpeg from 'fluent-ffmpeg';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { bgDataFolder, bgDataPath, getBackgroundsData } from './getBackgroundsData';
import { fileExists } from "../exposeDataPath";
import ffmpegStatic from 'ffmpeg-static';
import { existsSync } from "fs";

const getAssetPath = (...segments: string[]): string => {
    const base = app.isPackaged
        ? path.join(process.resourcesPath, 'app.asar.unpacked', 'dist')
        : path.join(__dirname, '..', '..');
    return path.join(base, ...segments);
};

function getFfmpegPath(): string {
    let ffmpegPath = ffmpegStatic as string;

    // Development mode → return original path
    if (!app.isPackaged) {
        console.log("[FFMPEG] Dev mode path:", ffmpegPath);
        return ffmpegPath;
    }

    // Production → rewrite app.asar → app.asar.unpacked
    let unpackedPath = ffmpegPath.replace("app.asar", "app.asar.unpacked");

    // Safety check: does the file exist?
    if (!existsSync(unpackedPath)) {
        console.error("[FFMPEG] Unpacked ffmpeg not found at:", unpackedPath);
        console.error("[FFMPEG] Original ffmpeg-static path:", ffmpegPath);
        throw new Error("FFmpeg binary missing in production build");
    }

    console.log("[FFMPEG] Using unpacked ffmpeg:", unpackedPath);
    return unpackedPath;
}


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

ffmpeg.setFfmpegPath(getFfmpegPath());

const extensions = {
    images: ["jpg", "jpeg", "png", "webp"],
    videos: ["mp4", "webm"]
}

const postersFolderPath = join(bgDataFolder, "posters")

export const addBackground = async (path: string) => {
    try {
        console.log('Starting to add background...');
        let backgrounds = await getBackgroundsData();

        const fileName = randomUUID()
        const extension = path.split('.').pop()?.toLowerCase();

        console.log('File extension:', extension);

        if (!extension) {
            console.error('File has no extension');
            throw new Error("File has no extension");
        }

        if (!await fileExists(path)) {
            console.error('File not found:', path);
            throw new Error("File not found: " + path);
        }

        let object: { path: string, type: "image" | "video", poster?: string } = { path: "", type: "image" };

        if (extensions.images.includes(extension)) {
            console.log('File is an image, copying...');
            const bgNewPath = join(bgDataFolder, "static", `${fileName}.${extension}`)
            await fs.copyFile(path, bgNewPath);
            object = { path: bgNewPath, type: "image" }
        }
        else if (extensions.videos.includes(extension)) {
            console.log('File is a video, converting...');
            const bgNewPath = join(bgDataFolder, "animated", `${fileName}.mp4`);
            await new Promise<void>((resolve, reject) => {
                ffmpeg(path)
                    .outputOptions([
                        '-c:v', 'libx264',
                        '-preset', 'veryfast',
                        '-crf', '18',
                        '-pix_fmt', 'yuv420p',
                        '-r', '30',
                        '-vf', 'scale=1920:-2',
                        '-movflags', '+faststart',
                        '-an'
                    ])
                    .output(bgNewPath)
                    .on('end', () => resolve())
                    .on('error', reject)
                    .run();
            });

            console.log("Video conversion completed, generating poster...");
            const poster = await new Promise<string>((resolve, reject) => {
                ffmpeg(path)
                    .screenshots({
                        count: 1,
                        timestamps: ['00:00:01'],
                        filename: `${fileName}.png`,
                        folder: postersFolderPath
                    })
                    .on('end', () => resolve(join(postersFolderPath, `${fileName}.png`)))
                    .on('error', (err) => {console.error('Error generating poster:', err);reject(err)});
            });

            console.log("Poster generated at:", poster);

            object = { path: bgNewPath, type: "video", poster }
        }

        else {
            console.error(`Invalid file type: .${extension}`);
            throw new Error(`Invalid file type: .${extension}`);
        }

        console.log('Adding background to data...');
        if (!backgrounds) {
            console.error('Couldn\'t fetch backgrounds data');
            throw new Error("Couldn't fetch backgrounds data");
        }

        backgrounds.push(object);
        await fs.writeFile(bgDataPath, JSON.stringify(backgrounds));
        console.log("Finished adding background");

    } catch (err) {
        console.error('Error adding background:', err);
        throw err;
    }
}