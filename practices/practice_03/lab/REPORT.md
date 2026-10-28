# REPORT

- Hardware: MacBook Pro 14" (2024), Apple M4
- Local runtime: Ollama 0.x, macOS
- Model ID: qwen3.5:9b (Ollama)
- Quantization: as installed by Ollama (default)
- Context length: 8192 (Modelfile), 32768 (agent Modelfile)
- Temperature: 0.2

Обоснование выбора: 9B модель на M4 обеспечивает стабильную скорость и качество для анализа небольшого учебного репозитория. Контекст 8k достаточен для задач, увеличенный контекст в агентном профиле используется для экспериментов в OpenCode.

Результаты ответа модели (run_questions.py): см. answers.json и файлы в lab/answers/.
Итоги по 5 вопросам:
1. Как запустить тесты — make test; источник: demo/Makefile и test_service.py. Ответ совпал по сути и основанию.
2. Пустое имя — ValueError("empty name"); подтверждено проверкой в service.py и тестом test_empty. Совпало.
3. unsubscribe — отсутствует в репозитории; модель корректно отметила, что ответа нет. Совпало.
4. CI — сведений нет; модель корректно указала отсутствие конфигурации. Совпало.
5. Персистентность — не сохраняются; хранятся в памяти процесса (set). Ответ корректный и обоснован README.md и service.py.

Команды запуска:
- Загрузка модели: `ollama pull qwen3.5:9b`
- Сборка профилей: `ollama create itmo-student -f Modelfile` и `ollama create itmo-agent -f Modelfile.agent`
- Тесты: `make test` из lab/
- Вопросы: `python3 run_questions.py` из lab/
