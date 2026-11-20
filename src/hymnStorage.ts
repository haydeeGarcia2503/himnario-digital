
import { openDB } from 'idb'

export type StoredHymn = {
  id: string
  number: number
  title: string
  category: string | null
  lyrics: string
  author: string | null
  composer: string | null
}

const DB_NAME = 'himnario-digital'
const STORE_NAME = 'hymns'
const DB_VERSION = 1

// Abrir o crear la base de datos local
const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, {
        keyPath: 'id',
      })
    }
  },
})

// Sincronizar los himnos publicados con el almacenamiento local
export async function saveHymns(hymns: StoredHymn[]) {
  const db = await dbPromise
  const transaction = db.transaction(STORE_NAME, 'readwrite')

  // Limpiar los registros anteriores
  await transaction.store.clear()

  // Guardar los himnos recibidos de Supabase
  for (const hymn of hymns) {
    await transaction.store.put(hymn)
  }

  await transaction.done
}

// Recuperar los himnos guardados
export async function getCachedHymns(): Promise<StoredHymn[]> {
  const db = await dbPromise
  const hymns = await db.getAll(STORE_NAME)

  return hymns.sort((a, b) => a.number - b.number)
}
