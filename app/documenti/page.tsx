import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Layout from '@/components/Layout'
import DocumentiContent from '@/components/DocumentiContent'

export default async function DocumentiPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Layout user={user}>
      <DocumentiContent />
    </Layout>
  )
}


