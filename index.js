import * as fs from "fs";
import { exec } from "child_process";

// Selecting all player files (more than one are possible)
// It seems like the last in list is most recent file
const file = fs
  .readdirSync("/home/pzserver/Zomboid/Logs")
  .filter((fileName) => fileName.endsWith("player.txt"))
  .slice(-1);

const filePath = "/home/pzserver/Zomboid/Logs/" + file;

// Check if the file exists in the current directory.
fs.access(filePath, fs.constants.F_OK, (err) => {
  if (err) {
    throw err;
  }

  console.log("File exists, starting watch...");

  fs.watch(filePath, (eventType, filename) => {
    console.log(`event type is: ${eventType}`);

    if (filename) {
      console.log(`filename provided: ${filename}`);
      exec(`wc -l ${filePath};tail -1 ${filePath}`, function (error, results) {
        // Parse data from log into desired format.
        const curlyb_match = results.match(/\{([^}]+)\}/g);
        const squareb_match = results.match(/\[([^\]]+)\]/g);

        const player = {
          name: results.split(" ")[4],
          perks: curlyb_match[0],
          traits: squareb_match[1],
          stats: curlyb_match[1],
          health: curlyb_match[2],
        };

        console.log(player);
        console.log("---end-tick---");
      });
    } else {
      console.log("filename not provided");
    }
  });
});
