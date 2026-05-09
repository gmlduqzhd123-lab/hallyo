'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { signup } from '../actions/auth'
import { toast } from 'sonner'
import { Waves } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const signupSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  role: z.enum(['admin', 'developer', 'athlete', 'coach', 'parents', 'guest']),
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const { mutate: handleSignup, isPending } = useMutation({
    mutationFn: async (data: SignupFormValues) => {
      const res = await signup(data)
      if (res?.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('회원가입이 완료되었습니다. 승인을 대기해주세요.')
      router.push('/pending')
    },
    onError: (error: Error) => {
      toast.error(`회원가입 실패: ${error.message}`)
    },
  })

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,71,171,0.12)] p-8 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="hidden md:block absolute bottom-0 left-0 w-32 h-32 bg-accent-pink/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="mx-auto w-28 h-28 flex items-center justify-center mb-4">
            <Image src="/logo.jpg" alt="여수한려초 수영부 로고" width={112} height={112} className="w-full h-full object-contain rounded-full shadow-md" />
          </div>
          <h1 className="text-2xl font-bold text-accent-navy mb-2">회원가입</h1>
          <p className="text-secondary-hover font-semibold tracking-wide">HALLYOSWIM</p>
        </div>

        <form className="space-y-5 relative z-10" onSubmit={handleSubmit((data) => handleSignup(data))}>
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

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">역할 (Role)</label>
            <select 
              {...register('role')}
              className={`w-full px-5 py-4 bg-slate-50 border-2 ${errors.role ? 'border-rose-400' : 'border-transparent focus:border-primary'} focus:bg-white rounded-2xl outline-none transition-all text-slate-800`}
              defaultValue="athlete"
            >
              <option value="athlete">선수 (Athlete)</option>
              <option value="parents">학부모 (Parents)</option>
              <option value="coach">지도자 (Coach)</option>
              <option value="guest">일반인 (Guest)</option>
              <option value="developer">개발자 (Developer)</option>
              <option value="admin">관리자 (Admin)</option>
            </select>
            {errors.role && <p className="text-rose-500 text-xs font-bold mt-2 ml-1">{errors.role.message}</p>}
          </div>
          
          <div className="pt-4 space-y-3">
            <button 
              type="submit"
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-bold py-4 rounded-full shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center"
            >
              {isPending ? '처리 중...' : '회원가입 완료'}
            </button>
            <Link 
              href="/login"
              className="w-full inline-flex justify-center text-sm text-slate-500 hover:text-primary font-bold py-2 transition-all"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
        </form>

        <div className="mt-8 p-4 bg-accent-pink/10 rounded-2xl border border-accent-pink/20 relative z-10">
          <p className="text-xs text-center font-bold text-accent-navy/80 leading-relaxed">
            <span className="text-rose-500">※</span> 회원가입 후 관리자(교사)의 승인이 완료되어야<br/>정상적인 접속이 가능합니다.
          </p>
        </div>
      </div>
      <div className="mt-8 text-center text-slate-400 text-sm font-medium tracking-wide">
        © 2026. [엽쌤, 달디단] All rights reserved.
      </div>
    </div>
  )
}
