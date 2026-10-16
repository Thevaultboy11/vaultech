// The only file that talks to Firebase. Everything else goes through sync.js.
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

const ref = ({ fs, db }, vault, section) => fs.doc(db, ROOT_COLLECTION, vault, 'sections', section);

export const backendName = 'Firestore';
export const configured = Boolean(firebaseConfig.projectId);

// onData(data | null) fires on first load and on every change (including from other devices).
export function subscribe(vault, section, onData, onError) {
  let unsub = null;
  let stopped = false;
  load()
    .then((s) => {
      if (stopped) return;
      unsub = s.fs.onSnapshot(
        ref(s, vault, section),
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

export async function write(vault, section, payload) {
  const s = await load();
  return s.fs.setDoc(ref(s, vault, section), payload);
}

export async function remove(vault, section) {
  const s = await load();
  return s.fs.deleteDoc(ref(s, vault, section));
}
