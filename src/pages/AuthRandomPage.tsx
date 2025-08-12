import { useAuth } from "../hooks/use-auth"

export default function AuthRandomPage() {
  const {user} = useAuth()


  return (
    <div>{`nome do otario: ${user?.name}`}</div>
  )
}