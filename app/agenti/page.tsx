import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import AgentiContent from '@/components/AgentiContent'

export default async function AgentiPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  if (user.ruolo !== 'punto_vendita') {
    redirect('/dashboard')
  }

  return (
    <Layout user={user}>
      <AgentiContent />
    </Layout>
  )
}


