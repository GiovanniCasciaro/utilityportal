import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import NewContrattoForm from '@/components/NewContrattoForm'

export default async function NewContrattoPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <NewContrattoForm />
    </Layout>
  )
}


