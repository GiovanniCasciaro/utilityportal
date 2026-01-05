import db from './db'

// Limiti di storage
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5MB in bytes
export const MAX_USER_STORAGE = 500 * 1024 * 1024 // 500MB in bytes

/**
 * Calcola lo spazio totale utilizzato da un utente in bytes
 */
export function getUserStorageUsed(userId: string): number {
  try {
    const result = db.prepare(`
      SELECT COALESCE(SUM(dimensioneBytes), 0) as total
      FROM documenti
      WHERE userId = ?
    `).get(userId) as { total: number }
    
    return result.total || 0
  } catch (error) {
    console.error('Error calculating user storage:', error)
    return 0
  }
}

/**
 * Verifica se l'utente ha abbastanza spazio per un nuovo file
 */
export function canUserUpload(userId: string, fileSize: number): { canUpload: boolean; message?: string } {
  // Verifica limite dimensione singolo file
  if (fileSize > MAX_UPLOAD_SIZE) {
    return {
      canUpload: false,
      message: `File troppo grande. Dimensione massima consentita: ${(MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(0)}MB`,
    }
  }

  // Verifica limite spazio totale utente
  const currentStorage = getUserStorageUsed(userId)
  const newTotalStorage = currentStorage + fileSize

  if (newTotalStorage > MAX_USER_STORAGE) {
    const usedMB = (currentStorage / (1024 * 1024)).toFixed(2)
    const maxMB = (MAX_USER_STORAGE / (1024 * 1024)).toFixed(0)
    return {
      canUpload: false,
      message: `Spazio insufficiente. Spazio utilizzato: ${usedMB}MB / ${maxMB}MB`,
    }
  }

  return { canUpload: true }
}

/**
 * Formatta bytes in formato leggibile
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

