import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import SettingsContent from '@/components/SettingsContent'

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <SettingsContent user={user} />
    </Layout>
  )
}


