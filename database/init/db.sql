/* 
 *  Create & init site content
 */
-- ITEMS --
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    name TEXT DEFAULT "",
    perks TEXT DEFAULT "",
    traits TEXT DEFAULT "",
    stats TEXT DEFAULT "",
    health TEXT DEFAULT "",
    UNIQUE(name)
);