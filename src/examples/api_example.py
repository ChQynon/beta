import requests

# Ваш API ключ
API_KEY = "samga_your_api_key_here"

# Учетные данные пользователя
IIN = "XXXXXXXXXXX"
PASSWORD = "your_password"

# Базовый URL API
BASE_URL = "https://example.com/api/v1"

# Заголовки запроса
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Получение оценок по четвертям с процентами
def get_term_grades(term_id=None):
    """Получение оценок по четвертям с процентами через POST запрос"""
    url = f"{BASE_URL}/schedule"
    data = {
        "iin": IIN,
        "password": PASSWORD
    }
    if term_id:
        data["term"] = term_id
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json()
    else:
        return {"error": response.status_code, "message": response.text}

# Вывод оценок по четвертям с процентами
def display_term_grades(grades_data):
    student = grades_data.get('student', {})
    print(f"Ученик: {student.get('fullName')}")
    print(f"Класс: {student.get('class')}")
    print(f"Школа: {student.get('school')}")
    print("-" * 50)
    
    subjects = grades_data.get('subjects', [])
    print(f"Всего предметов: {len(subjects)}")
    print("-" * 50)
    
    for subject in subjects:
        print(f"Предмет: {subject.get('name')}")
        
        # Вывод оценок по четвертям с процентами
        print("Оценки по четвертям:")
        for term in subject.get('terms', []):
            term_name = term.get('term', '')
            mark = term.get('mark')
            percentage = term.get('percentage')
            
            if mark is not None and percentage is not None:
                print(f"  {term_name}: {mark} ({percentage}%)")
            else:
                print(f"  {term_name}: не выставлена")
        
        # Текущая оценка и процент
        print(f"Текущая оценка: {subject.get('current_mark')} ({subject.get('current_percentage')}%)")
        print("-" * 30)
    
    # Средний балл
    avg = grades_data.get('overall_average', {})
    print(f"Средний балл: {avg.get('mark')} ({avg.get('percentage')}%)")
    print(f"Данные обновлены: {grades_data.get('updated_at')}")

# Вывод только процентов по четвертям для всех предметов
def display_percentage_summary(grades_data):
    print("\nСводка процентов по четвертям:")
    print("-" * 50)
    
    subjects = grades_data.get('subjects', [])
    term_names = []
    
    # Вычисляем имена всех четвертей
    for subject in subjects:
        for term in subject.get('terms', []):
            term_name = term.get('term')
            if term_name and term_name not in term_names:
                term_names.append(term_name)
    
    # Сортируем имена четвертей
    term_names.sort()
    
    # Заголовок таблицы
    header = "Предмет".ljust(25)
    for term_name in term_names:
        header += f" | {term_name}".ljust(15)
    header += " | Текущий %"
    print(header)
    print("-" * (25 + 15 * len(term_names) + 12))
    
    # Данные по предметам
    for subject in subjects:
        row = subject.get('name', '').ljust(25)
        
        # Проценты по четвертям
        for term_name in term_names:
            percentage = None
            for term in subject.get('terms', []):
                if term.get('term') == term_name:
                    percentage = term.get('percentage')
                    break
            
            if percentage is not None:
                row += f" | {percentage}%".ljust(15)
            else:
                row += " | -".ljust(15)
        
        # Текущий процент
        current_percentage = subject.get('current_percentage')
        if current_percentage is not None:
            row += f" | {current_percentage}%"
        else:
            row += " | -"
        
        print(row)
    
    # Средний процент
    avg_percentage = grades_data.get('overall_average', {}).get('percentage')
    avg_row = "СРЕДНИЙ БАЛЛ".ljust(25)
    for _ in term_names:
        avg_row += " | -".ljust(15)
    avg_row += f" | {avg_percentage}%"
    print("-" * (25 + 15 * len(term_names) + 12))
    print(avg_row)

# Основная функция
def main():
    print("Получение оценок по четвертям с процентами...")
    grades_data = get_term_grades()
    
    if 'error' in grades_data:
        print(f"Ошибка при получении данных: {grades_data.get('message')}")
    else:
        # Детальный вывод оценок по четвертям
        display_term_grades(grades_data)
        
        # Сводная таблица процентов
        display_percentage_summary(grades_data)

if __name__ == "__main__":
    main() 