const fs = require("fs");
const { exec } = require("child_process");

const express = require("express");
const app = express();
const port = 3000;

const cors = require("cors");

const sqlite3 = require("sqlite3").verbose();
const dbLight = new sqlite3.Database("./database/lightplayers.db");
const dbHeavy = new sqlite3.Database("./database/heavyplayers.db");

const helpers = require("./helpers");

// Selecting all player files (more than one are possible)
// It seems like the last in list is most recent file
const heavyFileName = fs
  .readdirSync("/home/pzserverheavy/Zomboid/Logs")
  .filter((fileName) => fileName.endsWith("player.txt"))
  .slice(-1);
const heavyFilePath = "/home/pzserverheavy/Zomboid/Logs/" + heavyFileName;

const lightFileName = fs
  .readdirSync("/home/pzserverlight/Zomboid/Logs")
  .filter((fileName) => fileName.endsWith("player.txt"))
  .slice(-1);
const lightFilePath = "/home/pzserverlight/Zomboid/Logs/" + lightFileName;

// Starts watching a player log file from light or heavy server
// Updates db when newline is written to log and that line is a tick
function logTickDBUpdate(filePath, updateFunc) {
  // Check if the file exists in the current directory.
  // fs.access(filePath, fs.constants.F_OK, (err) => {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      throw err;
    }

    if (stats.isFile()) {
      console.log("File exists, starting watch...");

      fs.watch(filePath, (eventType, filename) => {
        // I think we need to check if filePath is the file
        // that we want here.
        console.log("---start-tick---");
        console.log(`event type is: ${eventType}`);

        if (filename) {
          console.log(`filename provided: ${filename}`);
          exec(`wc -l ${filePath};tail -1 ${filePath}`, updateFunc);
        } else {
          console.log("filename not provided");
        }
      });
    } else if (stats.isDirectory()) {
      console.log("File does not exist in directory.");
    }
  });
}

// Start the watcher updaters.
logTickDBUpdate(heavyFilePath, helpers.updateOnTick);
logTickDBUpdate(lightFilePath, helpers.updateOnTick);

app.use(cors());

// These two callbacks can be abstracted
app.get("/light", (req, res) => {
  dbLight.all("SELECT * FROM players limit 20", (err, rows) => {
    if (err) {
      console.log(err);
      return;
    }

    if (rows) {
      res.send(rows);
    }
  });
});

app.get("/heavy", (req, res) => {
  dbHeavy.all("SELECT * FROM players limit 20", (err, rows) => {
    if (err) {
      console.log(err);
      return;
    }

    if (rows) {
      res.send(rows);
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
