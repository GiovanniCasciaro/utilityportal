import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import SimulatorePageClient from '@/components/SimulatorePageClient'

export default async function SimulatorePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <SimulatorePageClient />
    </Layout>
  )
}

