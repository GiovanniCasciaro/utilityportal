import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import ClienteAnagrafica from '@/components/ClienteAnagrafica'

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <ClienteAnagrafica clienteId={params.id} />
    </Layout>
  )
}


