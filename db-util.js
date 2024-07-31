import sqlite3 from "sqlite3";
sqlite3.verbose();

const serverDBs = {
  pel_pzserver: new sqlite3.Database("./database/pelplayers.db"),
  medium_pzserver: new sqlite3.Database("./database/mediumplayers.db"),
  heavy_pzserver: new sqlite3.Database("./database/heavyplayers.db"),
};

const loglineCount = {
  pel_pzserver: 0,
  medium_pzserver: 0,
  heavy_pzserver: 0,
};

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
          player,
        );
      } else {
        db.run(
          "INSERT INTO players (name, perks, traits, stats, health) VALUES ($name, $perks, $traits, $stats, $health) ON CONFLICT(name) DO UPDATE SET perks = $perks, traits = $traits, stats = $stats, health = $health",
          player,
        );
      }
    },
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

  const serverName = results.split("/")[2];
  const db = serverDBs[serverName];
  const currentLineNumber = Number(results.split("\n")[0].split(" ")[0]);

  if (loglineCount[serverName] === currentLineNumber) {
    console.log(loglineCount[serverName], currentLineNumber);
    console.log("We stopped dupin, well trying to at least\n");
    return;
  }

  loglineCount[serverName] = currentLineNumber;

  const player = createPlayerObj(results);

  console.log(
    `Inserting line number ${currentLineNumber} into the ${serverName}`,
  );
  insertOrUpdate(player, db);

  console.log(results);
}
