import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import EditClienteForm from '@/components/EditClienteForm'

export default async function EditClientePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <EditClienteForm clienteId={params.id} />
    </Layout>
  )
}

