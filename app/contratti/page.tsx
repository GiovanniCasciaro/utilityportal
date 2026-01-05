import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import ContrattiContent from '@/components/ContrattiContent'

export default async function ContrattiPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <ContrattiContent />
    </Layout>
  )
}


