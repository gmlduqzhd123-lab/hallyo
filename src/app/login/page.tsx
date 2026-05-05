'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { login } from '../actions/auth'
import { toast } from 'sonner'
import { Waves } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const loginSchema = z.object({
  name: z.string().min(2, '이름을 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const { mutate: handleLogin, isPending } = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const res = await login(data)
      if (res?.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('로그인에 성공했습니다.')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(`로그인 실패: ${error.message}`)
    },
  })

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,71,171,0.12)] p-8 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-pink/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <Waves className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-accent-navy mb-2">여수한려초등학교 수영부</h1>
          <p className="text-secondary-hover font-semibold tracking-wide">HALLYOSWIM</p>
        </div>

        <form className="space-y-5 relative z-10" onSubmit={handleSubmit((data) => handleLogin(data))}>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">이름</label>
            <input 
              type="text" 
              placeholder="홍길동"
              {...register('name')}
              className={`w-full px-5 py-4 bg-slate-50 border-2 ${errors.name ? 'border-rose-400' : 'border-transparent focus:border-primary'} focus:bg-white rounded-2xl outline-none transition-all text-slate-800 placeholder-slate-400`}
            />
            {errors.name && <p className="text-rose-500 text-xs font-bold mt-2 ml-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">비밀번호</label>
            <input 
              type="password" 
              placeholder="••••••••"
              {...register('password')}
              className={`w-full px-5 py-4 bg-slate-50 border-2 ${errors.password ? 'border-rose-400' : 'border-transparent focus:border-primary'} focus:bg-white rounded-2xl outline-none transition-all text-slate-800 placeholder-slate-400`}
            />
            {errors.password && <p className="text-rose-500 text-xs font-bold mt-2 ml-1">{errors.password.message}</p>}
          </div>
          
          <div className="pt-4 space-y-3">
            <button 
              type="submit"
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-bold py-4 rounded-full shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center"
            >
              {isPending ? '로딩 중...' : '로그인'}
            </button>
            <Link 
              href="/signup"
              className="w-full inline-flex justify-center bg-secondary/20 hover:bg-secondary/30 text-primary font-bold py-4 rounded-full transition-all active:scale-[0.98]"
            >
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
