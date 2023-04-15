import { readdir, watch, stat } from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import updateOnTick from "./helpers.js";

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
    console.log("Caught an error:");
    console.error(err);
  }
}

/**
 * Watch log file for new lines and
 * if new line has the data we need
 * update database with that data
 */
async function watchLogFile(absFP) {
  // NOTE: I am purposely crashing program under certain
  // conditions and haveing pm2 restart until those conditions are met
  try {
    const statobj = await stat(absFP);
    const isFile = statobj.isFile();

    if (!isFile) {
      throw new Error("This is not a file.");
    }

    console.log("watching: ", absFP);
    const watcher = watch(absFP, { signal });

    for await (const event of watcher) {
      console.log(event);

      if (event.eventType === "rename") {
        console.log("Server should be restarting here.");
        ac.abort();
      }

      if (event.eventType === "change") {
        exec(`wc -l ${absFP};tail -1 ${absFP}`, updateOnTick);
      }
    }
  } catch (err) {
    console.log("Caught an error:");
    console.error(err);
    // Abort seems to behave differently between
    // launching with node and pm2, to be continued...
    ac.abort();
    throw err;
  }
}

/**
 * Watch directory for filename changes
 * to keep watcher in sync with active logfile
 */
// async function watchLogDirectory() {}

/**
 * Main function to start the watching process
 */
export default async function startWatching() {
  const currentLightLogFile = await getPlayerLogFilename(
    "/home/pzserverlight/Zomboid/Logs"
  );
  const currentHeavyLogFile = await getPlayerLogFilename(
    "/home/pzserverheavy/Zomboid/Logs"
  );

  watchLogFile(currentLightLogFile);
  watchLogFile(currentHeavyLogFile);
}
