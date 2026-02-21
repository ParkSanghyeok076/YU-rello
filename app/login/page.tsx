import { AuthForm } from '@/components/AuthForm'

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "url('/로그인 배경 2.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <AuthForm mode="login" />
    </div>
  )
}
