import sqlite3 from "sqlite3";
sqlite3.verbose();

const dbLight = new sqlite3.Database("./database/lightplayers.db");
const dbHeavy = new sqlite3.Database("./database/heavyplayers.db");

let lastLightLogLineCount = 0;
let lastHeavyLogLineCount = 0;

// Insert player data if it doesnt exist, otherwise update the data.
function insertOrUpdate(player, db) {
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

/**
 * Parse player tick string into object for db entry.
 */
function createPlayerObj(playerTick) {
  const curlyb_match = playerTick.match(/\{([^}]+)\}/g);
  const squareb_match = playerTick.match(/\[([^\]]+)\]/g);

  return {
    $name: playerTick.split(/"(?!\d)(.*?)"/s)[1],
    $perks: curlyb_match[0],
    $traits: squareb_match[1],
    $stats: curlyb_match[1],
    $health: curlyb_match[2],
  };
}

// Callback for exec function
export default function updateOnTick(error, results) {
  if (error) {
    throw error;
  }

  if (!results) {
    console.log(results);
    console.log("no results?");
    return;
  }

  // If our line is a tick event then we enter into database
  // Now we also try to check for duplicates here
  const lightOrHeavyLogs = results.split("/")[2];
  const lightOrHeavyDB =
    lightOrHeavyLogs === "pzserverlight" ? dbLight : dbHeavy;
  const lastLineNumber =
    lightOrHeavyLogs === "pzserverlight"
      ? lastLightLogLineCount
      : lastHeavyLogLineCount;
  const currentLineNumber = Number(results.split("\n")[0].split(" ")[0]);
  const lineIsTick = results.split('"')[2].trim().split(" ")[0] === "tick";

  if (lineIsTick) {
    if (currentLineNumber === lastLineNumber) {
      console.log(lastLineNumber, currentLineNumber);
      console.log("We stopped dupin, well trying to at least\n");
      return;
    }

    if (lightOrHeavyLogs === "pzserverlight") {
      lastLightLogLineCount = currentLineNumber;
    } else if (lightOrHeavyLogs === "pzserverheavy") {
      lastHeavyLogLineCount = currentLineNumber;
    } else {
      throw new Error("Oh WTF YOU DON FUCKED UP NOW!");
    }

    const player = createPlayerObj(results);

    console.log(
      `Inserting line number ${currentLineNumber} into the ${lightOrHeavyLogs}`
    );
    insertOrUpdate(player, lightOrHeavyDB);
  }

  console.log(results);
}
