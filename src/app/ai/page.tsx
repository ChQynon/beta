'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  PaperPlaneRight, 
  Trash, 
  ArrowClockwise, 
  Image as ImageIcon, 
  Brain, 
  Eye, 
  EyeSlash, 
  Sparkle, 
  Copy, 
  CheckCircle,
  Code
} from '@phosphor-icons/react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  image?: string | null // Поддержка изображений (base64)
  hasThinking?: boolean // Индикатор наличия "мышления" AI
}

// Типы для API сообщений
type MessageContent = string | { type: string; text?: string; image_url?: { url: string } }[]
type ApiMessage = {
  role: 'user' | 'assistant' | 'system'
  content: MessageContent
}

// Функция для форматирования текста сообщений
function formatMessageText(text: string): React.ReactNode {
  // Сначала ищем блоки кода в тройных кавычках
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks: string[] = [];
  
  // Извлекаем блоки кода и заменяем их маркерами
  let processedText = text;
  const codeReplacements: {[key: string]: string} = {};
  
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const block = match[0];
    const marker = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(block);
    codeReplacements[marker] = block;
    processedText = processedText.replace(block, marker);
  }
  
  // Разбиваем текст на абзацы
  const paragraphs = processedText.split('\n\n');
  
  return (
    <>
      {paragraphs.map((paragraph, paragraphIndex) => {
        // Восстанавливаем блоки кода из маркеров
        let processedParagraph = paragraph;
        Object.keys(codeReplacements).forEach(marker => {
          if (processedParagraph.includes(marker)) {
            const replacement = codeReplacements[marker];
            if (replacement) {
              processedParagraph = processedParagraph.replace(marker, replacement);
            }
          }
        });
        
        // Проверяем, содержит ли абзац блок кода
        if (processedParagraph.trim().startsWith('```') && processedParagraph.trim().endsWith('```')) {
          const code = processedParagraph.trim().slice(3, -3).trim();
          const lines = code.split('\n') || [];
          const language = lines.length > 0 ? lines[0].trim() : '';
          const codeContent = lines.length > 0 ? lines.slice(1).join('\n').trim() : code;
          
          return (
            <div key={`p-${paragraphIndex}`} className="relative rounded-md overflow-hidden my-3 group">
              {/* Заголовок с языком программирования и кнопка копирования */}
              <div className="flex justify-between items-center px-3 py-1 bg-gray-800 text-gray-200 text-xs">
                <span>{language || "code"}</span>
                <CopyButton text={codeContent} isCode={true} />
              </div>
              {/* Блок кода */}
              <pre className="bg-gray-900 text-gray-200 p-3 overflow-x-auto">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }
        
        // Обработка списков
        if (processedParagraph.trim().startsWith('- ')) {
          const listItems = processedParagraph.split('\n- ').map(item => 
            item.startsWith('- ') ? item.substring(2) : item
          );
          
          return (
            <ul key={`p-${paragraphIndex}`} className="list-disc pl-5 my-2 space-y-1">
              {listItems.map((item, itemIndex) => (
                <li key={`li-${paragraphIndex}-${itemIndex}`}>
                  {formatInlineElements(item)}
                </li>
              ))}
            </ul>
          );
        }
        
        // Проверяем, является ли абзац заголовком
        if (processedParagraph.trim().startsWith('###')) {
          const headingText = processedParagraph.trim().replace(/^###\s*/, '');
          return (
            <h3 key={`p-${paragraphIndex}`} className="text-lg font-bold mt-4 mb-2">
              {formatInlineElements(headingText)}
            </h3>
          );
        }
        
        // Если это обычный абзац
        return (
          <p key={`p-${paragraphIndex}`} className={paragraphIndex > 0 ? 'mt-2' : ''}>
            {formatInlineElements(processedParagraph)}
          </p>
        );
      })}
    </>
  );
}

// Вспомогательная функция для обработки жирного текста и ссылок внутри абзацев
function formatInlineElements(text: string): React.ReactNode {
  // Разбиваем текст на части, находя заголовки, жирный текст и ссылки
  const parts = text.split(/(\*\*.*?\*\*|\bhttps?:\/\/\S+\b)/g);
  
  return parts.map((part, index) => {
    // Если часть начинается и заканчивается на **, форматируем как жирный текст
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2); // Убираем ** с начала и конца
      return <strong key={index} className="font-bold">{boldText}</strong>;
    }
    
    // Обрабатываем ссылки
    if (/^https?:\/\/\S+$/.test(part)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 dark:text-blue-400 hover:underline"
        >
          {part}
        </a>
      );
    }
    
    // Обычный текст возвращаем как есть
    return part;
  });
}

// Компонент кнопки копирования
function CopyButton({ text, isCode = false }: { text: string, isCode?: boolean }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => console.error('Не удалось скопировать текст: ', err)
    );
  };
  
  return (
    <button 
      onClick={handleCopy}
      className={`inline-flex items-center ${
        isCode 
          ? "px-1.5 py-1 text-xs text-gray-300 hover:text-white" 
          : "px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
      }`}
      title="Копировать"
    >
      {copied ? (
        <>
          <CheckCircle size={isCode ? 14 : 16} className="mr-1 text-green-500" />
          {!isCode && <span>Скопировано</span>}
        </>
      ) : (
        <>
          {isCode ? <Copy size={14} /> : <Copy size={16} className="mr-1" />}
          {!isCode && <span>Копировать</span>}
        </>
      )}
    </button>
  );
}

// Добавляем стили анимаций
const animationStyles = `
  @keyframes pulse-glow {
    0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
    100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
  }
  
  @keyframes neural-pulse {
    0% { opacity: 0.4; transform: scale(0.95); }
    50% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 0.4; transform: scale(0.95); }
  }
  
  @keyframes fade-slide-down {
    0% { opacity: 0; transform: translateY(-10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fade-slide-up {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes panel-expand {
    0% { opacity: 0; transform: scaleY(0.95); transform-origin: top; }
    100% { opacity: 1; transform: scaleY(1); transform-origin: top; }
  }
  
  @keyframes thinking-pulse {
    0%, 100% { background-color: rgba(125, 125, 255, 0.05); }
    50% { background-color: rgba(125, 125, 255, 0.1); }
  }
`;

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Привет! Я Plexy, ваш AI-ассистент. Чем я могу помочь вам сегодня?',
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [activeModel, setActiveModel] = useState<'default' | 'thinking'>('default')
  const [hiddenThinking, setHiddenThinking] = useState<Record<number, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Прокрутка к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Обработчик выбора изображения
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    if (!file || !file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение')
      return
    }
    
    // Проверяем размер файла (максимум 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер - 5 МБ')
      return
    }
    
    // Используем canvas для изменения размера и сжатия изображения
    const img = document.createElement('img');
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) return
      
      img.onload = () => {
        // Ограничиваем размер изображения
        let width = img.width
        let height = img.height
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800
        
        // Изменяем размер, если изображение больше максимальных значений
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          } else {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        
        // Создаем canvas для изменения размера и компрессии
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        // Рисуем изображение на canvas
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Сжимаем изображение в зависимости от размера
        // Для больших изображений используем более сильное сжатие
        let quality = 0.7; // Базовое качество
        if (width * height > 400000) { // Изображения больше ~600x600
          quality = 0.6;
        }
        if (width * height > 600000) { // Изображения больше ~800x800
          quality = 0.5;
        }
        
        // Конвертируем в JPEG с адаптивным качеством
        const compressedImage = canvas.toDataURL('image/jpeg', quality)
        console.log(`Изображение сжато с качеством ${quality}, новый размер: ${Math.round(compressedImage.length / 1024)} KB`);
        setSelectedImage(compressedImage)
      }
      
      img.src = event.target.result as string
    }
    
    reader.readAsDataURL(file)
  }

  // Открыть диалог выбора файла
  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  // Отменить выбор изображения
  const cancelImageSelection = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // Функция для переключения модели
  const toggleModel = () => {
    setActiveModel(prev => prev === 'default' ? 'thinking' : 'default')
  }
  
  // Функция для переключения видимости "мышления"
  const toggleThinking = (messageIndex: number) => {
    setHiddenThinking(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }))
  }
  
  // Функция для проверки, содержит ли сообщение раздел "мышления"
  const hasThinkingSection = (content: string) => {
    return (
      // Проверяем стандартный формат
      (content.includes('**Анализ:**') && content.includes('**Ответ:**')) ||
      // Проверяем альтернативный формат с тегами <think>
      (content.includes('<think>') && content.includes('</think>'))
    );
  }
  
  // Разделение контента на секции "мышления" и ответа
  const splitThinkingContent = (content: string) => {
    if (!hasThinkingSection(content)) return { thinking: null, answer: content }
    
    // Проверяем формат с тегами <think>
    if (content.includes('<think>') && content.includes('</think>')) {
      const thinkingMatch = content.match(/<think>([\s\S]*?)<\/think>/i);
      const answerText = content.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
      
      return {
        thinking: thinkingMatch?.[1]?.trim() || null,
        answer: answerText || content
      }
    }
    
    // Стандартный формат с **Анализ:** и **Ответ:**
    const thinkingMatch = content.match(/\*\*Анализ:\*\*\s*([\s\S]*?)(?=\*\*Ответ:\*\*)/i)
    const answerMatch = content.match(/\*\*Ответ:\*\*\s*([\s\S]*)/i)
    
    return {
      thinking: thinkingMatch?.[1]?.trim() || null,
      answer: answerMatch?.[1]?.trim() || content
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedImage) || isLoading) return
    
    // Добавляем сообщение пользователя
    const userMessage: Message = {
      role: 'user',
      content: input.trim() || 'Привет',
      timestamp: Date.now(),
      image: selectedImage
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSelectedImage(null)
    setIsLoading(true)
    setIsThinking(true)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    try {
      // Подготавливаем сообщения для API
      let apiMessages: ApiMessage[];
      
      // Проверяем, есть ли изображение
      if (userMessage.image) {
        // Получаем предыдущую историю сообщений
        apiMessages = messages.slice(0, -1).map(msg => ({
          role: msg.role,
          content: msg.content
        })) as ApiMessage[];
        
        // Правильно форматируем base64 изображение для API
        // Проверяем, содержит ли строка уже префикс data:image
        const imageUrl = userMessage.image.startsWith('data:image') 
          ? userMessage.image 
          : `data:image/jpeg;base64,${userMessage.image}`;
        
        console.log('Отправляем изображение на API, размер:', Math.round(imageUrl.length / 1024), 'KB');
        
        // Формируем сообщение с изображением и текстом
        apiMessages.push({
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            },
            {
              type: 'text',
              text: input.trim() || 'Опиши, что ты видишь на этой фотографии.'
            }
          ]
        });
      } else {
        apiMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })) as ApiMessage[];
        
        // Заменяем последнее сообщение на текущий ввод
        apiMessages[apiMessages.length - 1] = {
          role: 'user',
          content: input.trim() || 'Привет'
        };
      }
      
      // Отправляем запрос к API
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          modelType: activeModel
        }),
      })
      
      // Проверяем ответ
      if (!response.ok) {
        let errorMessage = `Ошибка API: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Данные ошибки API:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Нечего делать, используем стандартное сообщение об ошибке
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json()
      setIsThinking(false)
      
      // Проверяем на ошибки обработки изображений
      let content = data.content || 'Извините, я не могу ответить прямо сейчас.';
      if (content.includes('[Изображение слишком большое для обработки') || 
          content.includes('[Ошибка при обработке изображения')) {
        console.warn('Обнаружена ошибка обработки изображения в ответе');
      }
      
      const hasThinking = hasThinkingSection(content)
      
      // Добавляем ответ ассистента
      setMessages(prev => {
        const newMessages = [...prev, {
          role: 'assistant' as const,
          content: content,
          timestamp: Date.now(),
          hasThinking
        }]
        
        // Если есть секция мышления, всегда скрываем ее по умолчанию
        if (hasThinking) {
          setHiddenThinking(prev => ({
            ...prev,
            [newMessages.length - 1]: true // Всегда скрываем мышление по умолчанию
          }))
        }
        
        return newMessages
      })
    } catch (errorObj: unknown) {
      console.error('Error generating response:', errorObj)
      setIsThinking(false)
      
      // При ошибке показываем сообщение об ошибке
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Извините, произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.",
        timestamp: Date.now()
      }])
    } finally {
      setIsLoading(false)
    }
  }
  
  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Привет! Я Plexy, ваш AI-ассистент. Чем я могу помочь вам сегодня?',
        timestamp: Date.now()
      }
    ])
    setSelectedImage(null)
  }
  
  // Форматирование даты
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-10rem)]">
      {/* Добавляем встроенные стили */}
      <style jsx global>{animationStyles}</style>
      
      <Card className="flex flex-col h-full border-none shadow-none bg-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-4">
            <Avatar className={`border-2 shadow-lg transition-all duration-500 ${
              activeModel === 'thinking' 
                ? 'border-purple-500 animate-[pulse-glow_2s_infinite]' 
                : 'border-cyan-500'
            }`}>
              <AvatarFallback className={`relative overflow-hidden ${
                activeModel === 'thinking' 
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              } text-white font-semibold`}>
                {/* Нейронная сеть в логотипе */}
                <div className="absolute inset-0 flex items-center justify-center w-full h-full">
                  <div className="relative w-7 h-7">
                    {/* Центральный нейрон */}
                    <div className="absolute w-2.5 h-2.5 bg-white rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
                    
                    {/* Линии и узлы нейронной сети */}
                    {activeModel === 'thinking' ? (
                      <>
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                          <div key={i} 
                            className="absolute w-3 h-0.5 bg-white/70 left-1/2 top-1/2" 
                            style={{
                              transformOrigin: 'left center',
                              transform: `rotate(${deg}deg) translateX(0px)`,
                              animation: `neural-pulse ${1 + i * 0.2}s infinite`
                            }}
                          >
                            <div className="absolute right-0 w-1 h-1 bg-white rounded-full"></div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {[30, 90, 150, 210, 270, 330].map((deg, i) => (
                          <div key={i} 
                            className="absolute w-3 h-0.5 bg-white/70 left-1/2 top-1/2" 
                            style={{
                              transformOrigin: 'left center',
                              transform: `rotate(${deg}deg) translateX(0px)`
                            }}
                          >
                            <div className="absolute right-0 w-1 h-1 bg-white rounded-full"></div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className={`text-gradient transition-all duration-300 ${
                activeModel === 'thinking'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}>
                Plexy - AI Assistant
                {activeModel === 'thinking' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500 text-white rounded-md inline-flex items-center animate-[fade-slide-down_0.3s_ease-out_forwards]">
                    <Sparkle size={12} className="mr-1 animate-pulse" /> Think
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Ваш личный помощник <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-md">Powered by Plexy</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <div className="h-full overflow-y-auto p-4 rounded-md bg-background/50 backdrop-blur-sm border dark:border-neutral-800 dark:bg-neutral-900/50">
            <div className={`flex flex-col md:flex-row justify-between items-center mb-4 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeModel === 'thinking'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'bg-primary text-white'
            }`}>
              <h2 className="text-xl font-semibold flex items-center">
                AI-помощник 
                {activeModel === 'thinking' && (
                  <span className="text-sm font-normal ml-2 animate-[fade-slide-down_0.5s_ease-out_forwards] flex items-center">
                    <span className="inline-flex items-center animate-pulse mr-1">
                      <Brain size={14} className="mr-1" />
                    </span>
                    режим мышления
                  </span>
                )}
              </h2>
              <div className="flex items-center mt-2 md:mt-0">
                <button
                  className={`px-3 py-1 rounded-md transition-all duration-300 flex items-center space-x-1 ${
                    activeModel === 'thinking'
                      ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-inner'
                      : 'bg-primary-dark hover:bg-primary-darker'
                  }`}
                  onClick={toggleModel}
                  title={activeModel === 'default' ? 'Включить режим мышления' : 'Выключить режим мышления'}
                >
                  <Brain size={16} className={activeModel === 'thinking' ? 'animate-pulse' : ''} />
                  <span>{activeModel === 'default' ? 'Plexy Think' : 'Обычный режим'}</span>
                </button>
                <button
                  className={`ml-4 px-3 py-1 rounded-md transition-all duration-300 ${
                    activeModel === 'thinking'
                      ? 'bg-purple-700 hover:bg-purple-800 text-white'
                      : 'bg-primary-dark hover:bg-primary-darker'
                  }`}
                  onClick={clearChat}
                >
                  Очистить историю
                </button>
              </div>
            </div>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col mb-4 ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-xl px-4 py-3 max-w-[80%] shadow-sm transition-all animate-[fade-slide-up_0.3s_ease-out_forwards] ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                      : activeModel === 'thinking' && message.hasThinking
                        ? 'bg-white dark:bg-neutral-800/95 dark:text-white border border-purple-200 dark:border-purple-900'
                        : 'bg-white dark:bg-neutral-800 dark:text-white border border-gray-100 dark:border-neutral-700'
                  }`}
                >
                  {message.image && (
                    <div className="mb-3">
                      <img 
                        src={message.image} 
                        alt="Загруженное изображение" 
                        className="max-w-full max-h-64 rounded-md shadow-md"
                      />
                    </div>
                  )}
                  
                  {/* Отображение мышления и ответа для сообщений с режимом мышления */}
                  {message.hasThinking ? (
                    <div className="whitespace-pre-wrap message-content leading-relaxed">
                      {/* Кнопка переключения отображения мышления */}
                      <div className="flex justify-between mb-1">
                        <div>
                          {message.role === 'assistant' && (
                            <CopyButton text={splitThinkingContent(message.content).answer || message.content} />
                          )}
                        </div>
                        <button 
                          onClick={() => toggleThinking(index)} 
                          className={`text-xs flex items-center px-2 py-1 rounded-full transition-all ${
                            hiddenThinking[index]
                              ? 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 shadow-sm border border-purple-200 dark:border-purple-800/50'
                              : 'text-purple-700 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-800'
                          }`}
                        >
                          {hiddenThinking[index] ? 
                            <><Eye size={14} className="mr-1" /> Показать процесс мышления</> : 
                            <><EyeSlash size={14} className="mr-1" /> Скрыть процесс мышления</>
                          }
                        </button>
                      </div>
                      
                      {/* Секция мышления */}
                      {!hiddenThinking[index] && (
                        <div className="mb-3 rounded-md overflow-hidden animate-[panel-expand_0.3s_ease-out_forwards]">
                          <div className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-xs uppercase font-semibold text-purple-700 dark:text-purple-300 border-b border-purple-200 dark:border-purple-800 flex items-center">
                            <Brain size={14} className="mr-1.5 animate-pulse" /> Анализ
                          </div>
                          <div className="p-3 bg-purple-50/80 dark:bg-neutral-800/50 text-gray-700 dark:text-gray-300 animate-[thinking-pulse_3s_ease-in-out_infinite]">
                            {formatMessageText(splitThinkingContent(message.content).thinking || '')}
                          </div>
                        </div>
                      )}
                      
                      {/* Секция ответа */}
                      <div className="animate-[fade-slide-up_0.3s_ease-out_forwards]">
                        <div className="px-3 py-2 bg-cyan-100 dark:bg-cyan-900/20 text-xs uppercase font-semibold text-cyan-700 dark:text-cyan-300 rounded-t-md border-b border-cyan-200 dark:border-cyan-800 flex items-center">
                          <Sparkle size={14} className="mr-1.5" /> Ответ
                        </div>
                        <div className="p-3 bg-white/80 dark:bg-neutral-800/60 rounded-b-md">
                          {formatMessageText(splitThinkingContent(message.content).answer || message.content)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap message-content leading-relaxed">
                      {/* Кнопка копирования для обычных сообщений */}
                      {message.role === 'assistant' && (
                        <div className="flex justify-end mb-1">
                          <CopyButton text={message.content} />
                        </div>
                      )}
                      {formatMessageText(message.content)}
                    </div>
                  )}
                  
                  {(message.role === 'assistant' && message.content.includes('qynon')) ? (
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                      <a href="https://t.me/qynon" className="text-cyan-500 hover:underline">
                        @qynon
                      </a>
                    </span>
                  ) : null}
                  <div className="text-right text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex flex-col items-start mb-4">
                <div className={`rounded-xl px-4 py-3 shadow-md animate-[fade-slide-up_0.3s_ease-out_forwards] ${
                  activeModel === 'thinking' 
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200' 
                    : 'bg-neutral-100 dark:bg-neutral-800 dark:text-white'
                }`}>
                  <div className="flex items-center">
                    {activeModel === 'thinking' ? (
                      <>
                        <Brain size={16} className="mr-2 animate-pulse" />
                        <span className="mr-2 text-sm">Анализирую...</span>
                      </>
                    ) : null}
                    <div className="flex">
                      <div className={`w-2 h-2 rounded-full mx-0.5 animate-pulse ${
                        activeModel === 'thinking' ? 'bg-purple-500' : 'bg-cyan-500'
                      }`}></div>
                      <div className={`w-2 h-2 rounded-full mx-0.5 animate-pulse delay-150 ${
                        activeModel === 'thinking' ? 'bg-purple-500' : 'bg-cyan-500'
                      }`}></div>
                      <div className={`w-2 h-2 rounded-full mx-0.5 animate-pulse delay-300 ${
                        activeModel === 'thinking' ? 'bg-purple-500' : 'bg-cyan-500'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter className="pt-3">
          {selectedImage && (
            <div className="mb-2 w-full">
              <div className="relative w-fit animate-[fade-slide-down_0.3s_ease-out_forwards]">
                <img 
                  src={selectedImage} 
                  alt="Предпросмотр" 
                  className="h-20 rounded-md mr-2 shadow-md border border-gray-200 dark:border-gray-700" 
                />
                <button 
                  className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70 transition-all"
                  onClick={cancelImageSelection}
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={clearChat}
              title="Очистить чат"
              className="dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-all hover:scale-105"
            >
              <Trash size={18} />
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleModel}
              title={activeModel === 'default' ? 'Включить режим мышления' : 'Выключить режим мышления'}
              className={`transition-all hover:scale-105 ${
                activeModel === 'thinking' 
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-700 animate-[pulse-glow_2s_infinite]' 
                  : 'dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700'
              }`}
            >
              <Brain size={18} className={activeModel === 'thinking' ? 'animate-pulse' : ''} />
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={openFileDialog}
              title="Прикрепить изображение"
              className="dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-all hover:scale-105"
            >
              <ImageIcon size={18} />
            </Button>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*" 
              className="hidden"
            />
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите сообщение..."
              className={`flex-1 transition-all focus:ring-2 focus:ring-opacity-50 ${
                activeModel === 'thinking' 
                  ? 'dark:border-purple-700 focus:ring-purple-400 dark:focus:ring-purple-700' 
                  : 'dark:border-neutral-700 focus:ring-cyan-400 dark:focus:ring-cyan-700'
              } dark:bg-neutral-800 dark:text-white`}
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className={`transition-all duration-300 hover:scale-105 shadow-md ${
                activeModel === 'thinking'
                  ? isLoading ? 'bg-purple-600' : 'bg-purple-500 hover:bg-purple-600'
                  : isLoading ? 'bg-cyan-600' : 'bg-cyan-500 hover:bg-cyan-600'
              }`}
            >
              {isLoading ? (
                <ArrowClockwise size={18} className="animate-spin" />
              ) : (
                <PaperPlaneRight size={18} className="animate-[fade-slide-up_0.2s_ease-out_forwards]" />
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}