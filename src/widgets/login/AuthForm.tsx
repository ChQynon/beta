'use client'

import React, { useState } from 'react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeSlash, Spinner } from '@phosphor-icons/react'
import { login } from '@/server/actions/login'
import { useRouter } from 'next-nprogress-bar'
import { useToast } from '@/lib/providers/ToastProvider'

const schema = z.object({
  iin: z
    .string({
      invalid_type_error: 'ИИН должен быть строкой',
      required_error: 'ИИН обязателен',
    })
    .length(12, { message: 'ИИН должен быть из 12 символов' })
    .refine(
      (iin) => {
        if (isNaN(parseInt(iin))) return false

        const year = parseInt(iin.slice(0, 2))
        const month = parseInt(iin.slice(2, 4))
        const day = parseInt(iin.slice(4, 6))

        if (month > 12 || month < 1) {
          return false
        }

        if (day < 1 || day > 31) {
          return false
        }

        if (month === 2) {
          const isLeapYear =
            (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
          if (isLeapYear && day > 29) {
            return false
          } else if (!isLeapYear && day > 28) {
            return false
          }
        }

        const monthsWith30Days = [4, 6, 9, 11]
        return !(monthsWith30Days.includes(month) && day > 30)
      },
      {
        message: 'Некорректный ИИН',
      },
    ),
  password: z
    .string({
      invalid_type_error: 'Пароль должен быть строкой',
      required_error: 'Пароль обязателен',
    })
    .min(6, 'Пароль должен быть не менее 6 символов'),
})

type AuthFormType = z.infer<typeof schema>

interface AuthFormProps {
  redirectPath?: string;
}

const AuthForm = ({ redirectPath = '/' }: AuthFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessEffect, setShowSuccessEffect] = useState(false);
  const form = useForm<AuthFormType>({
    resolver: zodResolver(schema),
  })

  const router = useRouter()
  const { showToast } = useToast()

  const onSubmit: SubmitHandler<AuthFormType> = async ({ iin, password }) => {
    await login(iin, password).then((res) => {
      if (res.success) {
        // Сохраняем данные в localStorage для использования в NFC и QR авторизации
        try {
          localStorage.setItem('user-iin', iin)
          localStorage.setItem('user-password', password)
        } catch (e) {
          console.error('Ошибка при сохранении данных авторизации:', e)
        }
        
        // Показываем анимацию успешной авторизации
        setShowSuccessEffect(true);
        
        showToast('Вход выполнен успешно', 'success')
        
        // Убираем эффект через 1.5 секунды и выполняем переход
        setTimeout(() => {
          setShowSuccessEffect(false);
          router.push(redirectPath)
        }, 1500);
      } else {
        if (res.errors?.iin) form.setError('iin', { message: res.errors?.iin })
        if (res.errors?.password)
          form.setError('password', { message: res.errors?.password })
        
        showToast('Ошибка при входе', 'error')
      }
    })
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      {/* Эффект зеленого свечения при успешной авторизации */}
      {showSuccessEffect && (
        <div className="success-glow-effect"></div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <FormField
            control={form.control}
            name="iin"
            render={({ field }) => (
              <FormItem className="mb-1 mt-1">
                <FormControl>
                  <Input placeholder="ИИН" autoComplete="username" {...field} />
                </FormControl>
                <FormMessage className="pb-1 leading-none text-red-600" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="mb-1 mt-1">
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Пароль"
                      autoComplete="current-password"
                      type={showPassword ? "text" : "password"}
                      {...field}
                    />
                    <button 
                      type="button"
                      onClick={toggleShowPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeSlash className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="pb-1 leading-none text-red-600" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={form.formState.isSubmitting}
          >
            Продолжить
            {form.formState.isSubmitting ? (
              <Spinner className="ml-1 animate-spin-slow" />
            ) : (
              <ArrowRight className="ml-1" />
            )}
          </Button>
        </form>
      </Form>
      
      <style jsx global>{`
        @keyframes glowEffect {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(34, 197, 94, 0.3);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        
        .success-glow-effect {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 100;
          pointer-events: none;
          border: 8px solid rgba(34, 197, 94, 0.4);
          border-radius: 10px;
          animation: glowEffect 1.5s ease-out forwards;
        }
      `}</style>
    </>
  )
}

export default AuthForm
