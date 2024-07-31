import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import startWatching from "./watcher.js";

const app = express();
const port = 3000;

sqlite3.verbose();

const serverDBs = {
  light: new sqlite3.Database("./database/pelplayers.db"),
  heavy: new sqlite3.Database("./database/heavyplayers.db"),
  medium: new sqlite3.Database("./database/mediumplayers.db"),
};

// This starts the watching program, it could be its own standalone script running,
// really no reason to run it in the same project as the api from what I can see.
startWatching();

// So remote vps can call this api
app.use(cors());

app.get("/:db", (req, res) => {
  const db = req.params.db;
  const reqDB = serverDBs[db];

  if (!reqDB) {
    res.status(404).send(`Invalid database: ${db}`);
    return;
  }

  reqDB.all("SELECT * FROM players", (err, rows) => {
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
