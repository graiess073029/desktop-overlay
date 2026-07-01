import { ChildProcess } from "child_process";

export let ttbProcess: ChildProcess | null = null;
export let ttbPath: string | null = null;

export const setTTbPath = (path: string | null) => ttbPath = path;
export const setTtbProcess = (process: ChildProcess | null) => ttbProcess = process;

