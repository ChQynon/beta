import { NextResponse } from 'next/server'

// Типы данных сообщений
type MessageContent = string | { type: string; text?: string; image_url?: { url: string } }[]
type Message = {
  role: string
  content: MessageContent
}
type MessagePart = {
  type: string
  text?: string
  image_url?: { url: string }
}

// Константы для работы с Chutes.ai
const CHUTES_API_TOKEN = 'cpk_459f629d1fc042f9ae1b90d5c5f3decc.3f7d10636ffd544aa861bf5fa961d509.twAeNTykToyvCXhHfGOUsXoI8pbQKeM2'
const MODELS = {
  default: 'chutesai/Mistral-Small-3.1-24B-Instruct-2503',
  thinking: 'moonshotai/Kimi-VL-A3B-Thinking'
}

// Системный промпт для Plexy
const SYSTEM_PROMPT = `
Ты - Plexy, умный AI-ассистент образовательной платформы samga.top.

Основная информация:
- Твоя задача - отвечать на вопросы пользователей максимально точно, полно и по существу.
- Ты работаешь на сайте samga.top - современной образовательной платформе.
- Сайт разработан командой samgay_nis (создатель: @qynon).

Ключевые правила:
- ВСЕГДА четко и прямо отвечай на заданный вопрос, не увиливай от темы и не меняй тему.
- ВСЕГДА внимательно анализируй запрос пользователя и все вложенные изображения.
- Если тебе отправили изображение, ты ДОЛЖЕН детально описать, что на нем изображено.
- Если тебе задали вопрос, отвечай конкретно на этот вопрос, а не на какой-то другой.

Поддержка и контакты:
- Если у пользователей возникают технические проблемы, они могут обратиться в поддержку: @qynon (Telegram).


Стиль общения:
- Дружелюбный, вежливый, готовый помочь.
- Краткий и по делу, но готовый объяснить подробнее если спросят.
- Используй **жирный текст** для выделения важной информации (заключай текст в двойные звездочки).
- Формируй ответы с хорошим форматированием - используй переносы строк для разделения абзацев.
- Пиши структурированно, используй списки, где это уместно.
`

export async function POST(request: Request) {
  try {
    // Получаем сообщения из запроса
    const body = await request.json()
    const { messages, modelType = 'default' } = body
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Неверный формат запроса: требуется массив сообщений' },
        { status: 400 }
      )
    }
    
    // Выбираем модель
    const selectedModel = MODELS[modelType as keyof typeof MODELS] || MODELS.default;
    const isThinkingModel = modelType === 'thinking';
    
    // Модифицируем системный промпт для режима "мышления", если выбрана соответствующая модель
    let finalSystemPrompt = SYSTEM_PROMPT;
    if (isThinkingModel) {
      finalSystemPrompt = `${SYSTEM_PROMPT}

Дополнительные инструкции для режима мышления:
- Всегда начинай свой ответ с секции "**Анализ:**", где подробно описывай ход своих мыслей.
- После анализа добавляй секцию "**Ответ:**", где дай краткий и чёткий ответ пользователю.
- ВАЖНО: НЕ используй форматирование вида <think>...</think>, вместо этого используй ТОЛЬКО "**Анализ:**" и "**Ответ:**".
- В секции анализа рассуждай вслух, показывая, как ты обдумываешь информацию.
- Важно: делай анализ детальным и интересным, примерно 100-200 слов.
- КРАЙНЕ ВАЖНО: твой анализ и ответ должны точно соответствовать вопросу пользователя.
- Если тебе отправили изображение, обязательно проанализируй все его видимые детали.
- Твой ответ должен прямо отвечать на поставленный вопрос, а не уводить в сторону.
`;
    }
    
    // Подготавливаем сообщения для API, добавляя системный промпт
    const formattedMessages = [
      { role: 'system', content: finalSystemPrompt },
      ...messages.map((msg: Message) => {
        // Обрабатываем сообщения с изображениями
        if (Array.isArray(msg.content)) {
          // Создаем массив частей сообщения, включая текст и изображения
          let formattedContent = [];
          
          for (const part of msg.content) {
            if (part.type === 'text' && part.text) {
              formattedContent.push({
                type: 'text',
                text: part.text
              });
            } else if (part.type === 'image_url' && part.image_url) {
              // Проверяем формат URL изображения
              const imageUrl = part.image_url.url;
              
              try {
                if (imageUrl.startsWith('data:image/')) {
                  console.log('Найдено base64-изображение, размер:', Math.round(imageUrl.length / 1024), 'KB');
                  
                  // Проверяем размер base64 (примерно)
                  const base64Size = imageUrl.length - (imageUrl.indexOf(',') + 1);
                  // 4.5MB в base64 примерно 6MB файл, что является предельным для многих моделей
                  if (base64Size > 4500000) {
                    console.warn('Изображение слишком большое:', Math.round(base64Size / 1024), 'KB');
                    formattedContent.push({
                      type: 'text',
                      text: "[Изображение слишком большое для обработки. Пожалуйста, используйте меньшее изображение (до 4MB).]"
                    });
                  } else {
                    formattedContent.push({
                      type: 'image_url',
                      image_url: { url: imageUrl }
                    });
                    
                    console.log('Изображение успешно добавлено в запрос');
                  }
                } else {
                  console.log('Найдено изображение по URL:', imageUrl.substring(0, 30) + '...');
                  formattedContent.push({
                    type: 'image_url',
                    image_url: { url: imageUrl }
                  });
                }
              } catch (imageError) {
                console.error('Ошибка при обработке изображения:', imageError);
                formattedContent.push({
                  type: 'text',
                  text: "[Ошибка при обработке изображения. Попробуйте другое изображение.]"
                });
              }
            }
          }
          
          // Если массив пустой, добавляем приветствие по умолчанию
          if (formattedContent.length === 0) {
            formattedContent.push({
              type: 'text',
              text: 'Привет'
            });
          }
          
          return {
            role: msg.role,
            content: formattedContent
          };
        }
        return msg;
      })
    ]
    
    // Отправляем запрос к Chutes.ai API
    try {
      console.log('Отправка запроса к API - количество сообщений:', formattedMessages.length);
      
      // Проверяем наличие изображений в сообщениях
      const hasImages = formattedMessages.some(msg => {
        if (Array.isArray(msg.content)) {
          return msg.content.some(part => part.type === 'image_url');
        }
        return false;
      });
      
      console.log('Сообщения содержат изображения:', hasImages);
      
      if (hasImages) {
        console.log('Структура сообщения с изображением:', 
          JSON.stringify(
            formattedMessages.find(msg => 
              Array.isArray(msg.content) && 
              msg.content.some(part => part.type === 'image_url')
            ), 
            null, 
            2
          )
        );
      }
      
      const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CHUTES_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": selectedModel,
          "messages": formattedMessages,
          "max_tokens": 2048,
          "temperature": 0.5,
          "stream": false
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Chutes.ai API ошибка ${response.status}:`, errorText)
        throw new Error(`Ошибка API: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Ответ API:', JSON.stringify(data, null, 2));
      const aiResponse = data.choices?.[0]?.message?.content
      
      if (!aiResponse) {
        throw new Error('Отсутствует содержимое ответа')
      }
      
      return NextResponse.json({ content: aiResponse })
    } catch (apiError) {
      console.error('Ошибка API:', apiError)
      return NextResponse.json(
        { content: "Извините, произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз." },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Ошибка обработки запроса:', error)
    return NextResponse.json(
      { content: "Извините, произошла ошибка. Пожалуйста, попробуйте еще раз." },
      { status: 200 } // Отправляем 200 для предотвращения ошибок на клиенте
    )
  }
} 