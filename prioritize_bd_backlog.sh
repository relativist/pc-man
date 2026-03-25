#!/usr/bin/env bash
set -euo pipefail

# Root and epics
bd update pcm-stl -p P0
bd update pcm-stl.1 pcm-stl.2 pcm-stl.3 pcm-stl.4 -p P1
bd update pcm-stl.5 pcm-stl.6 -p P2
bd update pcm-stl.7 -p P3

# MVP start five
bd update pcm-stl.1.1 pcm-stl.1.4 pcm-stl.2.1 pcm-stl.3.1 pcm-stl.4.3 -p P0 --add-label mvp-start

# Foundation for MVP
bd update pcm-stl.1.2 pcm-stl.1.3 pcm-stl.1.5 -p P1
bd update pcm-stl.2.2 pcm-stl.2.3 pcm-stl.2.4 -p P1
bd update pcm-stl.3.2 pcm-stl.3.3 pcm-stl.3.4 -p P1
bd update pcm-stl.4.1 pcm-stl.4.2 pcm-stl.4.4 -p P1
bd update pcm-stl.5.1 pcm-stl.5.2 -p P1
bd update pcm-stl.6.1 -p P1

# Secondary systems and detailed pages
bd update pcm-stl.2.5 pcm-stl.2.6 -p P2
bd update pcm-stl.3.5 pcm-stl.3.6 -p P2
bd update pcm-stl.4.5 pcm-stl.4.6 pcm-stl.4.7 -p P2
bd update pcm-stl.5.3 pcm-stl.5.4 pcm-stl.5.5 pcm-stl.5.6 -p P2
bd update pcm-stl.6.2 pcm-stl.6.3 pcm-stl.6.4 pcm-stl.6.5 pcm-stl.6.6 pcm-stl.6.7 -p P2

# Content and balance pass
bd update pcm-stl.7.1 pcm-stl.7.2 pcm-stl.7.3 pcm-stl.7.4 pcm-stl.7.5 pcm-stl.7.6 -p P3

# Subtasks for core startup work
bd create --silent --type task --parent pcm-stl.1.1 --title "Зафиксировать единицы игрового времени" --description "Нужно описать базовые единицы времени игры: день, месяц, год и их связь с реальным временем."
bd create --silent --type task --parent pcm-stl.1.1 --title "Описать пересчет минут в месяцы и годы" --description "Нужно формально зафиксировать правила 1 минута = 1 месяц и 10 минут = 1 год."
bd create --silent --type task --parent pcm-stl.1.1 --title "Перечислить системы, зависящие от времени" --description "Нужно описать, какие игровые подсистемы используют время: возраст, работа, обучение, заказы, голод и события."

bd create --silent --type task --parent pcm-stl.1.4 --title "Описать структуру PlayerState" --description "Определить состав состояния героя, включая характеристики, навыки, имущество, семью и активные эффекты."
bd create --silent --type task --parent pcm-stl.1.4 --title "Описать структуру активных таймеров" --description "Нужно определить формат хранения таймеров для работы, заказов, обучения, прогулок и лечения."
bd create --silent --type task --parent pcm-stl.1.4 --title "Описать справочники контента" --description "Нужно определить структуры данных для профессий, книг, заказов, должностей, событий и комплектующих."
bd create --silent --type task --parent pcm-stl.1.4 --title "Описать производные показатели героя" --description "Нужно определить, как считаются капитал, расходы семьи, скорость обучения и доступность заказов."

# Subtasks for hero state
bd create --silent --type task --parent pcm-stl.2.1 --title "Определить обязательные характеристики героя" --description "Список базовых числовых параметров: возраст, деньги, здоровье, голод, вес, спорт и другие обязательные поля."
bd create --silent --type task --parent pcm-stl.2.1 --title "Определить социальные атрибуты героя" --description "Нужно описать хранение семьи, друзей, детей, супруги и питомцев."
bd create --silent --type task --parent pcm-stl.2.1 --title "Определить имущественные атрибуты героя" --description "Нужно описать деньги, недвижимость, капитал, комплектующие ПК и прочее имущество."
bd create --silent --type task --parent pcm-stl.2.1 --title "Зафиксировать стартовое состояние нового героя" --description "Нужно определить начальный возраст, стартовые деньги, стартовую работу, базовые характеристики и начальный ПК."

# Subtasks for specializations
bd create --silent --type task --parent pcm-stl.3.1 --title "Зафиксировать список игровых специальностей" --description "Нужно окончательно утвердить список специальностей для MVP без дублирования ролей."
bd create --silent --type task --parent pcm-stl.3.1 --title "Описать 5 уровней квалификации для каждой специальности" --description "Нужно определить смысл уровней 1-5 и ожидаемый диапазон задач на каждом уровне."
bd create --silent --type task --parent pcm-stl.3.1 --title "Определить рост квалификации через обучение" --description "Нужно описать, как книги и материалы повышают уровень специальности."
bd create --silent --type task --parent pcm-stl.3.1 --title "Определить рост квалификации через выполнение заказов" --description "Нужно описать, как практика и завершение задач повышают профильный навык."
bd create --silent --type task --parent pcm-stl.3.1 --title "Определить правила мультиспециализации" --description "Нужно описать, как герой развивает несколько специальностей одновременно и есть ли между ними ограничения."

# Subtasks for orders
bd create --silent --type task --parent pcm-stl.4.3 --title "Определить обязательные поля заказа" --description "Нужно зафиксировать структуру заказа: тип, сложность, длительность, награда, опыт, шанс провала и требования."
bd create --silent --type task --parent pcm-stl.4.3 --title "Описать доступность заказа по квалификации" --description "Нужно определить, как уровень специальности открывает заказы соответствующей сложности."
bd create --silent --type task --parent pcm-stl.4.3 --title "Описать доступность заказа по уровню ПК" --description "Нужно определить правило, по которому уровень ПК ограничивает максимальный уровень заказов."
bd create --silent --type task --parent pcm-stl.4.3 --title "Описать награды и риск провала заказа" --description "Нужно определить, как рассчитываются деньги, опыт и последствия случайного провала."

# Subtasks for social loop
bd create --silent --type task --parent pcm-stl.5.2 --title "Определить правила появления друзей на прогулке" --description "Нужно описать, с какой логикой и вероятностью герой заводит новых друзей во время прогулок."
bd create --silent --type task --parent pcm-stl.5.2 --title "Определить счетчик заказов у друга" --description "Нужно описать хранение количества заказов, уже выданных конкретным другом."
bd create --silent --type task --parent pcm-stl.5.2 --title "Описать исчезновение друга после 3 заказов" --description "Нужно формально зафиксировать правило удаления друга из активного пула после третьего заказа."
bd create --silent --type task --parent pcm-stl.5.2 --title "Описать цикл пополнения друзей через прогулки" --description "Нужно зафиксировать, как прогулки восполняют пул друзей и заказов."

# Helpful labels for key focus areas
bd update pcm-stl.1 pcm-stl.2 pcm-stl.3 pcm-stl.4 --add-label core-mvp
bd update pcm-stl.5 --add-label social-loop
bd update pcm-stl.6 --add-label ui
bd update pcm-stl.7 --add-label content
