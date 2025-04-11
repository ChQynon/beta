'use client'

import { useState, useCallback, useEffect } from 'react'
import { useNativePlatform } from './useNativePlatform'

// NDEFReader доступен только в определенных браузерах
declare global {
  interface Window {
    NDEFReader?: any
    // Capacitor плагины
    CapacitorNFC?: {
      startScan: (options?: any) => Promise<void>
      stopScan: () => Promise<void>
      write: (options: { text: string }) => Promise<void>
      addListener: (event: string, callback: (data: any) => void) => Promise<void>
      removeAllListeners: () => Promise<void>
    }
  }
}

// Тип для статуса NFC
type NFCStatus = 'idle' | 'reading' | 'writing' | 'error' | 'ready' | 'not-started'

// Тип для событий NFC Reader
export type NDEFReaderEventResult = {
  message?: {
    records: Array<{
      recordType?: string
      mediaType?: string
      data?: ArrayBuffer
      encoding?: string
      lang?: string
    }>
  }
  serialNumber?: string
}

// Интерфейс взаимодействия с NFC
export interface NFCHook {
  isAvailable: boolean
  status: NFCStatus
  error: Error | null
  startReading: () => Promise<void>
  stopReading: () => Promise<void>
  startWriting: (data: string) => Promise<void>
  stopNFC: () => void
  isSupported: boolean
  isScanning: boolean
  startScan: (callback: (data: NDEFReaderEventResult) => void) => void
}

// Тип для хранения информации об устройстве
export interface DeviceInfo {
  id: string
  name: string
  browser: string
  lastAccess: string
  timestamp: number
}

// Named export of the useNFC hook
export function useNFC(): NFCHook {
  const [isAvailable, setIsAvailable] = useState(false)
  const [status, setStatus] = useState<NFCStatus>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const { isNative, isAndroid, isIOS } = useNativePlatform()
  
  // Проверка доступности NFC
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        // Проверка для нативных приложений (Capacitor)
        if (isNative) {
          if (window.CapacitorNFC) {
            setIsAvailable(true)
            console.log('NFC доступен через Capacitor плагин')
          } else {
            console.log('NFC плагин Capacitor не найден')
            setIsAvailable(false)
          }
        } 
        // Проверка для веб-браузеров
        else if ('NDEFReader' in window) {
          setIsAvailable(true)
          console.log('Web NFC API доступен')
        } else {
          console.log('Web NFC API не поддерживается')
          setIsAvailable(false)
        }
      } catch (error) {
        console.error('Ошибка при проверке NFC:', error)
        setIsAvailable(false)
      }
    }
    
    checkAvailability()
  }, [isNative, isAndroid, isIOS])
  
  // Очистка ресурсов при размонтировании
  useEffect(() => {
    return () => {
      // Очистка обработчиков для Capacitor
      if (isNative && window.CapacitorNFC) {
        window.CapacitorNFC.removeAllListeners().catch((e) => console.error('Ошибка при удалении слушателей NFC:', e))
      }
    }
  }, [isNative])
  
  // Остановка NFC операций
  const stopNFC = useCallback(() => {
    setStatus('idle')
    setError(null)
    setIsScanning(false)
  }, [])

  // Запуск сканирования NFC с колбэком
  const startScan = useCallback((callback: (data: NDEFReaderEventResult) => void) => {
    if (!isAvailable) {
      setError(new Error('NFC не поддерживается на этом устройстве'))
      return
    }
    
    try {
      setStatus('reading')
      setError(null)
      setIsScanning(true)
      
      // @ts-ignore - Web NFC API может не быть в TypeScript определениях
      const ndef = new window.NDEFReader()
      
      ndef.scan().then(() => {
        ndef.addEventListener("reading", (event: NDEFReaderEventResult) => {
          callback(event)
        })
      }).catch((error: Error) => {
        setError(error)
        setStatus('error')
        setIsScanning(false)
      })
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Ошибка инициализации NFC'))
      setStatus('error')
      setIsScanning(false)
    }
  }, [isAvailable])
  
  // Запуск чтения NFC
  const startReading = useCallback(async () => {
    try {
      setStatus('reading')
      setError(null)
      
      // Используем нативный плагин в мобильных приложениях
      if (isNative && window.CapacitorNFC) {
        // Устанавливаем обработчики событий для нативного NFC
        await window.CapacitorNFC.addListener('nfcTagDiscovered', (event: any) => {
          console.log('Обнаружена NFC метка через Capacitor:', event)
          
          // Извлекаем текст из метки
          if (event.tag && event.tag.textRecords && event.tag.textRecords.length > 0) {
            const text = event.tag.textRecords[0]
            
            // Генерируем событие для обработки в приложении
            window.dispatchEvent(new CustomEvent('nfc-auth-data', { 
              detail: JSON.parse(text)
            }))
          }
        })
        
        // Запускаем сканирование
        await window.CapacitorNFC.startScan()
        console.log('Сканирование NFC запущено через Capacitor')
      } 
      // Для веб-браузеров используем Web NFC API
      else if ('NDEFReader' in window) {
        // Создаем экземпляр NFC
        const ndef = new window.NDEFReader()
        
        // Запускаем сканирование
        await ndef.scan()
        console.log('Сканирование NFC запущено через Web NFC API')
        
        // Обработка событий чтения
        ndef.addEventListener('reading', (event: any) => {
          console.log('Обнаружена NFC метка через Web NFC API:', event)
          
          // Проходим по записям и находим текстовую
          if (event.message && event.message.records) {
            for (const record of event.message.records) {
              if (record.recordType === 'text') {
                record.data.text().then((text: string) => {
                  try {
                    // Генерируем событие для обработки в приложении
                    window.dispatchEvent(new CustomEvent('nfc-auth-data', { 
                      detail: JSON.parse(text) 
                    }))
                  } catch (e) {
                    console.error('Ошибка при разборе данных NFC:', e)
                  }
                })
              }
            }
          }
        })
      } else {
        throw new Error('NFC не поддерживается на этом устройстве')
      }
    } catch (e: any) {
      console.error('Ошибка при запуске NFC чтения:', e)
      setStatus('error')
      setError(new Error(e.message || 'Неизвестная ошибка NFC'))
    }
  }, [isNative])
  
  // Остановка чтения NFC
  const stopReading = useCallback(async () => {
    try {
      // Для нативных приложений
      if (isNative && window.CapacitorNFC) {
        await window.CapacitorNFC.stopScan()
        await window.CapacitorNFC.removeAllListeners()
      }
      
      setStatus('idle')
    } catch (e: any) {
      console.error('Ошибка при остановке NFC чтения:', e)
      setError(new Error(e.message || 'Ошибка при остановке NFC'))
    }
  }, [isNative])
  
  // Запись данных в NFC
  const startWriting = useCallback(async (data: string) => {
    try {
      setStatus('writing')
      setError(null)
      
      // Нативная запись через Capacitor
      if (isNative && window.CapacitorNFC) {
        await window.CapacitorNFC.write({ text: data })
        console.log('Данные успешно записаны через Capacitor')
      } 
      // Запись через Web NFC API
      else if ('NDEFReader' in window) {
        // Создаем экземпляр NFC
        const ndef = new window.NDEFReader()
        
        // Записываем данные
        await ndef.write({ 
          records: [{ recordType: "text", data: data }] 
        })
        
        console.log('Данные успешно записаны через Web NFC API')
      } else {
        throw new Error('NFC не поддерживается на этом устройстве')
      }
      
      setStatus('idle')
    } catch (e: any) {
      console.error('Ошибка при записи в NFC:', e)
      setStatus('error')
      setError(new Error(e.message || 'Ошибка при записи в NFC'))
    }
  }, [isNative])
  
  return {
    isAvailable,
    status,
    error,
    startReading,
    stopReading,
    startWriting,
    stopNFC,
    isSupported: isAvailable,
    isScanning,
    startScan
  }
}

// Make useNFC available both as a named export and via default export
const NFCHookExport = { useNFC };
export default NFCHookExport; 