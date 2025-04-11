'use client'

import React, { useEffect, useState } from 'react'
import AuthForm from '@/widgets/login/AuthForm'
import Logo from '@/components/misc/Logo'
import { env } from '@/env'
import NFCLogin from '@/components/NFCLogin'
import { useRouter } from 'next-nprogress-bar'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/lib/providers/ToastProvider'
import { login } from '@/server/actions/login'

const Page = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/'
  const { showToast } = useToast()
  
  // Обработчик получения данных аутентификации через NFC
  const handleAuthReceived = async (iin: string, password: string, deviceId: string) => {
    // Сохраняем ID устройства и учетные данные
    try {
      localStorage.setItem('samga-current-device-id', deviceId)
      localStorage.setItem('user-iin', iin)
      localStorage.setItem('user-password', password)
      
      // Выполняем вход
      const result = await login(iin, password)
      if (result.success) {
        showToast('Вход выполнен успешно через NFC', 'success')
        router.push(redirectPath)
      } else {
        showToast('Ошибка при входе: неверные данные аутентификации', 'error')
      }
    } catch (e) {
      console.error('Ошибка при обработке аутентификации через NFC:', e)
      showToast('Не удалось выполнить вход', 'error')
    }
  }
  
  return (
    <div className="items-left mx-auto flex h-screen max-w-96 flex-col justify-center p-4 text-left page-transition">
      <div className="mb-6 flex items-center">
        <Logo width={48} height={48} className="mr-3" withText={true} />
      </div>
      
      <h2 className="w-full scroll-m-20 text-left text-3xl font-semibold leading-none tracking-tight first:mt-0">
        Вход
      </h2>

      <p className="w-full text-left leading-7 text-muted-foreground">
        Используйте свой аккаунт СУШ
      </p>

      <AuthForm redirectPath={redirectPath} />
      
      <NFCLogin onAuthReceived={handleAuthReceived} />
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <a href={env.NEXT_PUBLIC_CONTACT_LINK} target="_blank" rel="noopener" className="hover:text-primary transition-colors">
          Создано qynon
        </a>
      </div>
    </div>
  )
}

export default Page
