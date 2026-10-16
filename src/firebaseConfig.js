// Firebase web config for the "vaultboy-projecet" project.
// These values are meant to be public (they ship inside every Firebase web app).
// What protects your data is the Firestore security rules — see README → Cloud sync.
export const firebaseConfig = {
  apiKey: 'AIzaSyA4yCWVCYVK74ELUF4LyILgmFBs0q8-K7c',
  authDomain: 'vaultboy-projecet.firebaseapp.com',
  projectId: 'vaultboy-projecet',
  storageBucket: 'vaultboy-projecet.firebasestorage.app',
  messagingSenderId: '149287396818',
  appId: '1:149287396818:web:2e220da5f70d777007940b',
};

// All Vault Tech data lives under this top-level collection, separate from
// anything else in the project:  vaultech/{vaultKey}/sections/{section}
export const ROOT_COLLECTION = 'vaultech';
