import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import ClientiContent from '@/components/ClientiContent'

export default async function ClientiPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <ClientiContent user={user} />
    </Layout>
  )
}


