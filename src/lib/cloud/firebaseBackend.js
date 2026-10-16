// The only file that talks to Firebase. One document per vault: vaultech/{vaultKey}.
// The Firebase SDK is loaded lazily so the app itself opens instantly.
import { ROOT_COLLECTION, firebaseConfig } from '../../firebaseConfig';

let sdk = null;
function load() {
  if (!sdk)
    sdk = Promise.all([import('firebase/app'), import('firebase/firestore')]).then(([app, fs]) => ({
      fs,
      db: fs.getFirestore(app.initializeApp(firebaseConfig)),
    }));
  return sdk;
}

const ref = ({ fs, db }, vault) => fs.doc(db, ROOT_COLLECTION, vault);

export const backendName = 'Firestore';
export const configured = Boolean(firebaseConfig.projectId);

export function subscribe(vault, onData, onError) {
  let unsub = null;
  let stopped = false;
  load()
    .then((s) => {
      if (stopped) return;
      unsub = s.fs.onSnapshot(
        ref(s, vault),
        (snap) => onData(snap.exists() ? snap.data() : null),
        (err) => onError(err)
      );
    })
    .catch(onError);
  return () => {
    stopped = true;
    if (unsub) unsub();
  };
}

export async function write(vault, payload) {
  const s = await load();
  return s.fs.setDoc(ref(s, vault), payload);
}

export async function remove(vault) {
  const s = await load();
  return s.fs.deleteDoc(ref(s, vault));
}
