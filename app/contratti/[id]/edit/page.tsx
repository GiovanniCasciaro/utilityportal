import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import EditContrattoForm from '@/components/EditContrattoForm'

export default async function EditContrattoPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <EditContrattoForm contrattoId={params.id} />
    </Layout>
  )
}

