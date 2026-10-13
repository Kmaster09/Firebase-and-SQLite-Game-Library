
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

import { db } from './firebaseConfig';

/*
  MODULE 9 — CLOUD GAME COLLECTION

  Firebase Cloud Firestore CRUD
  TODO 1 — READ
  TODO 2 — CREATE
  TODO 3 — UPDATE
  TODO 4 — DELETE
*/

// Make sure Firebase is connected
function checkFirebase() {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Check your .env.local file.'
    );
  }
}

// TODO 1 — READ
export async function getGames() {
  checkFirebase();

  const gamesCollection = collection(db, 'games');

  const snapshot = await getDocs(gamesCollection);

  const games = snapshot.docs.map((gameDoc) => ({
    ...gameDoc.data(),
    id: gameDoc.id,
  }));

  return games;
}

// TODO 2 — CREATE
export async function addGame(game) {
  checkFirebase();

  const gamesCollection = collection(db, 'games');

  const { id, ...gameData } = game;

  const documentReference = await addDoc(
    gamesCollection,
    gameData
  );

  return {
    ...gameData,
    id: documentReference.id,
  };
}

// TODO 3 — UPDATE
export async function updateGame(id, changes) {
  checkFirebase();

  const gameReference = doc(db, 'games', id);

  const { id: ignoredId, ...updatedFields } = changes;

  await updateDoc(gameReference, updatedFields);

  return {
    ...updatedFields,
    id,
  };
}

// TODO 4 — DELETE
export async function deleteGame(id) {
  checkFirebase();

  const gameReference = doc(db, 'games', id);

  await deleteDoc(gameReference);

  return id;
}
