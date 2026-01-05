import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import ContrattoDetail from '@/components/ContrattoDetail'

export default async function ContrattoDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <ContrattoDetail contrattoId={params.id} />
    </Layout>
  )
}


