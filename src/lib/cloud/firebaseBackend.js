// The only file that talks to Firebase.
// Google sign-in (Firebase Auth) + ONE Firestore document per account:  vaultech/{uid}
//   { data: { profile, settings, tasks: [...], courses: [...], ... }, updatedAt, email }
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, initializeFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { ROOT_COLLECTION, firebaseConfig } from '../../firebaseConfig';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// ignoreUndefinedProperties: optional fields that are `undefined` are simply skipped
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

const ref = (uid) => doc(db, ROOT_COLLECTION, uid);
const toUser = (u) => u && { uid: u.uid, email: u.email || '', name: u.displayName || '', photo: u.photoURL || '' };

export const backendName = 'Firestore';

export function onAuth(cb) {
  return onAuthStateChanged(auth, (u) => cb(toUser(u)));
}

export async function signIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export const signOut = () => fbSignOut(auth);

export async function load(uid) {
  const snap = await getDoc(ref(uid));
  return snap.exists() ? snap.data() : null;
}

// Fires when the document changes (e.g. from your other device)
export function watch(uid, onData, onError) {
  return onSnapshot(ref(uid), (snap) => onData(snap.exists() ? snap.data() : null, snap.metadata.hasPendingWrites), onError);
}

export function save(uid, payload) {
  return setDoc(ref(uid), payload);
}
