import { sampleUsers, sampleProducts } from "@/lib/sampleData"
import { notFound } from "next/navigation"
import UserProfileClient from "./UserProfileClient"

export async function generateStaticParams() {
  return sampleUsers.map((user) => ({
    id: user.id,
  }))
}

interface UserProfilePageProps {
  params: {
    id:string
  }
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const user = sampleUsers.find((u) => u.id === params.id)
  const userProducts = sampleProducts.filter((p) => p.farmerId === params.id)

  if (!user) {
    notFound()
  }

  return <UserProfileClient user={user} userProducts={userProducts} />
}
