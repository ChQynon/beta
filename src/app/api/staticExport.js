// Этот файл проверяет, запущен ли процесс статического экспорта
// и исключает API роуты из сборки в этом случае

export function isStaticExport() {
  return process.env.BUILD_TYPE === 'static';
}

// Этот файл должен импортироваться в API роутах для предотвращения 
// их включения в статическую сборку Capacitor 