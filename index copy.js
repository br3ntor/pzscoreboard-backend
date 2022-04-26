import * as fs from "fs";
import { exec } from "child_process";

// Selecting all PerkLog files (more than one are possible)
// It seems like the last in list is most recent file
const file = fs
  .readdirSync("/home/pzserver/Zomboid/Logs")
  .filter((fileName) => fileName.endsWith("player.txt"))
  .slice(-1);

const filePath = "/home/pzserver/Zomboid/Logs/" + file;
// let lastNumLines = 0;

// Check if the file exists in the current directory.
fs.access(filePath, fs.constants.F_OK, (err) => {
  if (err) {
    throw err;
  }

  console.log("File exists, starting watch...");
  let lastNumLines = 0;

  fs.watch(filePath, (eventType, filename) => {
    console.log(`event type is: ${eventType}`);

    if (filename) {
      console.log(`filename provided: ${filename}`);
      exec(`wc -l ${filePath};tail -1 ${filePath}`, function (error, results) {
        console.log(results.split("\n"));
        // Parse first line to get line number of log file
        const numLines = Number(results.split(" ")[0]);
        console.log("Numlines: " + numLines);
        console.log("LastNumLines: " + lastNumLines);

        // Two lines can be written to the file, it seems they are seperate by almost immediate?
        // So I get two watch events both with the same data. This is the case when a user joins.
        // So in the case these are the same, we are seeing the duplicate data.
        if (numLines === lastNumLines) {
          console.log("This data has already been seen.");
        }

        // This happens when a user joins.
        if (numLines - 2 === lastNumLines) {
          // lastNumLines == numLines;
          console.log("User has joined.");
        }

        // This happens on a death or level change.
        if (numLines - 1 === lastNumLines) {
          // lastNumLines = numLines;
          console.log("Level Changed");
        }

        // Update lastNum at end.
        lastNumLines = numLines;

        // const t = results.split("\n")[1].split(" ")[0];
        // const data = results
        //   .split("\n")[1]
        //   .split(" ")[1]
        //   .split("]")
        //   .map((el) => el.slice(1));
        // const theInfo = {
        //   timeStamp: results.split("\n")[1].split(" ")[0],
        //   steamID: data[0],
        // };

        // Parse results
        // Store results
        // Decide how to display and update results
      });
    } else {
      console.log("filename not provided");
    }
  });
});
