const fs = require("fs");
const { exec } = require("child_process");

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/db.sqlite");

const express = require("express");
const app = express();
const port = 3000;

// Selecting all player files (more than one are possible)
// It seems like the last in list is most recent file
const file = fs
  .readdirSync("/home/pzserver/Zomboid/Logs")
  .filter((fileName) => fileName.endsWith("player.txt"))
  .slice(-1);

const filePath = "/home/pzserver/Zomboid/Logs/" + file;

db.serialize(() => {
  db.run("DELETE FROM players;", () => {
    console.log("players cleared");
  });
});

// Check if the file exists in the current directory.
fs.access(filePath, fs.constants.F_OK, (err) => {
  if (err) {
    throw err;
  }

  console.log("File exists, starting watch...");

  fs.watch(filePath, (eventType, filename) => {
    console.log("---start-tick---");
    console.log(`event type is: ${eventType}`);

    if (filename) {
      console.log(`filename provided: ${filename}`);
      exec(`wc -l ${filePath};tail -1 ${filePath}`, function (error, results) {
        if (error) {
          console.log(error);
          return;
        }

        if (!results) {
          console.log(results);
          console.log("no results?");
          return;
        }

        // If our line is a tick event then we enter into database
        if (results.split(" ")[5] === "tick") {
          // Parse data from log into desired format.
          const curlyb_match = results.match(/\{([^}]+)\}/g);
          const squareb_match = results.match(/\[([^\]]+)\]/g);

          const player = {
            $name: results.split(" ")[4].replace(/['"]+/g, ""),
            $perks: curlyb_match[0],
            $traits: squareb_match[1],
            $stats: curlyb_match[1],
            $health: curlyb_match[2],
          };

          // Insert player data if it doesnt exist, otherwise update the data.
          db.get(
            "SELECT * FROM players WHERE name = ?",
            player["$name"],
            (err, rows) => {
              if (err) {
                console.log(err);
                return;
              }

              if (rows) {
                db.run(
                  "UPDATE players SET perks = $perks, traits = $traits, stats = $stats, health = $health WHERE name = $name",
                  player
                );
              } else {
                db.run(
                  "INSERT INTO players (name, perks, traits, stats, health) VALUES ($name, $perks, $traits, $stats, $health) ON CONFLICT(name) DO UPDATE SET perks = $perks, traits = $traits, stats = $stats, health = $health",
                  player
                );
              }
            }
          );
        }
        console.log("---end-tick---");
      });
    } else {
      console.log("filename not provided");
    }
  });
});

app.get("/", (req, res) => {
  db.all("SELECT * FROM players", (err, rows) => {
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
