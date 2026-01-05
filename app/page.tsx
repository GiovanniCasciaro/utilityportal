'use client'

import LoginPage from '@/components/LoginPage'

export default function Home() {
  // Il middleware gestisce i reindirizzamenti, quindi non abbiamo bisogno di reindirizzamento lato client qui
  return <LoginPage />
}


