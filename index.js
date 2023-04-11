import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import startWatching from "./watcher.js";

const app = express();
const port = 3000;

sqlite3.verbose();

const dbLight = new sqlite3.Database("./database/lightplayers.db");
const dbHeavy = new sqlite3.Database("./database/heavyplayers.db");

startWatching();
app.use(cors());

// These two callbacks can be abstracted
app.get("/light", (req, res) => {
  dbLight.all("SELECT * FROM players", (err, rows) => {
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
  dbHeavy.all("SELECT * FROM players", (err, rows) => {
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
