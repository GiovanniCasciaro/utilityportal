import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getUserStorageUsed, formatBytes, MAX_USER_STORAGE } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    const usedBytes = getUserStorageUsed(user.id)
    const usedMB = (usedBytes / (1024 * 1024)).toFixed(2)
    const maxMB = (MAX_USER_STORAGE / (1024 * 1024)).toFixed(0)
    const percentage = ((usedBytes / MAX_USER_STORAGE) * 100).toFixed(1)

    return NextResponse.json({
      success: true,
      storage: {
        used: usedBytes,
        usedFormatted: formatBytes(usedBytes),
        usedMB: parseFloat(usedMB),
        max: MAX_USER_STORAGE,
        maxFormatted: formatBytes(MAX_USER_STORAGE),
        maxMB: parseFloat(maxMB),
        percentage: parseFloat(percentage),
        available: MAX_USER_STORAGE - usedBytes,
        availableFormatted: formatBytes(MAX_USER_STORAGE - usedBytes),
      },
    })
  } catch (error) {
    console.error('Error fetching storage:', error)
    return NextResponse.json(
      { message: 'Errore del server' },
      { status: 500 }
    )
  }
}

