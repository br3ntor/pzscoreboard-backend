import { readdir, watch, stat } from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { updateOnTick } from "./helpers";

const ac = new AbortController();
const { signal } = ac;

/**
 * Return the current filename and full path
 * of the active player log file
 */
async function getPlayerLogFilename(logsDir) {
  try {
    const logFiles = await readdir(logsDir);
    const fileName = logFiles
      .filter((fileName) => fileName.endsWith("player.txt"))
      .slice(-1);
    const fullFilePath = path.format({
      dir: logsDir,
      base: fileName,
    });

    return fullFilePath;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Watch log file for new lines and
 * if new line has the data we need
 * update database with that data
 */
async function watchLogFile(absFP) {
  try {
    const statobj = await stat(absFP);
    const fileExists = statobj.isFile();
    if (fileExists) {
      console.log("watching: ", absFP);
      const watcher = watch(absFP, { signal });
      for await (const event of watcher) {
        console.log(event);
        exec(`wc -l ${absFP};tail -1 ${absFP}`, updateOnTick);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 * Watch directory for filename changes
 * to keep watcher in sync with active logfile
 */
async function watchLogDirectory() {}

/**
 * Main file to start the watching process
 */
export async function startWatching() {
  const currentLightLogFile = await getPlayerLogFilename(
    "/home/pzserverlight/Zomboid/Logs"
  );
  const currentHeavyLogFile = await getPlayerLogFilename(
    "/home/pzserverheavy/Zomboid/Logs"
  );

  watchLogFile(currentLightLogFile);
  watchLogFile(currentHeavyLogFile);
}
