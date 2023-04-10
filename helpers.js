import sqlite3 from "sqlite3";
sqlite3.verbose();

const dbLight = new sqlite3.Database("./database/lightplayers.db");
const dbHeavy = new sqlite3.Database("./database/heavyplayers.db");

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
  const lineIsTick = results.split('"')[2].trim().split(" ")[0] === "tick";

  if (lineIsTick) {
    const player = createPlayerObj(results);
    const dbToUpdate =
      results.split("/")[2] === "pzserverlight" ? dbLight : dbHeavy;

    insertOrUpdate(player, dbToUpdate);
  }

  console.log(results);
}
