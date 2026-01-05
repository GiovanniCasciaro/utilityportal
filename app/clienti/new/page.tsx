import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import NewClienteForm from '@/components/NewClienteForm'

export default async function NewClientePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <NewClienteForm />
    </Layout>
  )
}


