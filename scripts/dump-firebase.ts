/**
 * Dump all existing data from Firestore to see field structure.
 * Usage: npx tsx scripts/dump-firebase.ts
 */
import {initializeApp} from 'firebase/app';
import {getFirestore, collection, getDocs} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCLS_0hARtQCjdqpGe85d-FR0gHRWfskeA',
  authDomain: 'foodandnote.firebaseapp.com',
  projectId: 'foodandnote',
  storageBucket: 'foodandnote.firebasestorage.app',
  messagingSenderId: '1039429513177',
  appId: '1:1039429513177:web:ed3e3b257073e99c2973c8',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function dump() {
  const collections = ['recipes', 'categories', 'notes', 'foods', 'meals', 'menus', 'items', 'dishes', 'users', 'settings'];

  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (snap.size === 0) continue;

      console.log(`\n${'═'.repeat(70)}`);
      console.log(`📂 Collection: "${colName}" — ${snap.size} documents`);
      console.log('═'.repeat(70));

      snap.docs.forEach((docSnap, i) => {
        const data = docSnap.data();
        console.log(`\n  📄 Doc [${i + 1}] id="${docSnap.id}"`);
        console.log(`     Fields: ${JSON.stringify(Object.keys(data))}`);
        console.log(`     Data: ${JSON.stringify(data, null, 2).split('\n').join('\n     ')}`);
      });
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        // skip silently
      } else {
        console.log(`\n  ⚠️  Collection "${colName}": ${err?.message || err}`);
      }
    }
  }

  console.log('\n\n✅ Dump complete.\n');
  process.exit(0);
}

dump().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
