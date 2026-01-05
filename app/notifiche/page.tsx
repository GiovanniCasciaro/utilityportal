import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import NotificheContent from '@/components/NotificheContent'

export default async function NotifichePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <NotificheContent />
    </Layout>
  )
}


