import { watch, stat } from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import updateOnTick from "./db-util.js";

/**
 * Watches log directory and updates db when player log changes.
 * @param {string} logPath - The full path to server logs.
 */
async function watchLogDirectory(logPath, cb) {
  const ac = new AbortController();
  const { signal } = ac;

  try {
    const statobj = await stat(logPath);
    const isDirectory = statobj.isDirectory();

    if (!isDirectory) {
      throw new Error("This is not a directory.");
    }

    console.log("watching directory: ", logPath);

    const watcher = watch(logPath, { signal });

    for await (const event of watcher) {
      if (event.eventType === "rename") {
        console.log("File removed or added to directory ");
      }

      if (
        event.eventType === "change" &&
        event.filename.includes("player.txt")
      ) {
        const fullFilePath = path.format({
          dir: logPath,
          base: event.filename,
        });
        // updateOnTick could be taken in as an argument and watchLogDirectory
        // could be exported and called directly instead of exporting startWatching
        // NOTE tail is just being used to get last line of file, maybe should try
        // just reading last line with node, would def have to do some refactoring,
        // maybe out of curiosity later, a reason to would be cross compatability.
        exec(`wc -l ${fullFilePath};tail -1 ${fullFilePath}`, cb);
      }
    }
  } catch (err) {
    console.log("Caught an error watching directory:");
    console.log(err);
  }
}

/**
 * Main function to start the watching
 * both servers log directories.
 */
export default function startWatching() {
  watchLogDirectory("/home/pel_pzserver/Zomboid/Logs", updateOnTick);
  watchLogDirectory("/home/medium_pzserver/Zomboid/Logs", updateOnTick);
  watchLogDirectory("/home/heavy_pzserver/Zomboid/Logs", updateOnTick);
}
