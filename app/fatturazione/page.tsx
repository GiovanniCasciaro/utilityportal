import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import FatturazioneContent from '@/components/FatturazioneContent'

export default async function FatturazionePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <FatturazioneContent />
    </Layout>
  )
}


