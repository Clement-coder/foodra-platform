import { notFound } from "next/navigation"
import UserProfileClient from "./UserProfileClient"

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const userRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/${params.id}`, {
    cache: "no-store",
  })

  if (!userRes.ok) notFound()

  const user = await userRes.json()

  const productsRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/products?userId=${params.id}`,
    { cache: "no-store" }
  )

  const userProducts = await productsRes.json()

  return <UserProfileClient user={user} userProducts={userProducts} />
}
