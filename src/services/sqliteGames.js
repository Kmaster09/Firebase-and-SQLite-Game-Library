
import * as SQLite from 'expo-sqlite';

// Keep one database connection open
let database = null;

// OPEN AND CREATE SQLITE DATABASE
export async function openLocalGamesDatabase() {
  if (!database) {
    console.log('SQLite: Starting database connection');

    const db = await SQLite.openDatabaseAsync('cloud-games.db');

    console.log('SQLite: Database opened successfully');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        genre TEXT,
        platform TEXT,
        status TEXT,
        rating INTEGER DEFAULT 0,
        favorite INTEGER DEFAULT 0,
        coverUrl TEXT
      );
    `);

    database = db;
  }

  return database;
}

// SAVE OR UPDATE A GAME IN SQLITE
export async function saveGameLocally(game) {
  const db = await openLocalGamesDatabase();

  await db.runAsync(
    `INSERT OR REPLACE INTO games
      (id, title, genre, platform, status, rating, favorite, coverUrl)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    String(game.id),
    game.title,
    game.genre ?? '',
    game.platform ?? '',
    game.status ?? 'Backlog',
    game.rating ?? 0,
    game.favorite ? 1 : 0,
    game.coverUrl ?? ''
  );

  console.log('Saved locally:', game.title);
}

// LOAD ALL SAVED GAMES FROM SQLITE
export async function getLocalGames() {
  const db = await openLocalGamesDatabase();

  const rows = await db.getAllAsync(
    'SELECT * FROM games ORDER BY title ASC'
  );

  return rows.map((row) => ({
    ...row,
    favorite: Boolean(row.favorite),
  }));
}
