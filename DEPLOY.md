# Деплой на Beget (React + PHP)

## Структура проекта

```
node-hosting-test/
├── frontend/        — Vite + React, собирается локально
│   ├── src/
│   ├── index.html
│   └── dist/        — артефакт сборки (загружается на сервер)
├── backend/         — PHP API
│   ├── api.php
│   ├── db.php
│   └── config.php
└── DEPLOY.md
```

---

## Локальная разработка

**Backend (PHP, встроенный сервер):**
```powershell
cd backend
php -S localhost:8000
```

**Frontend (Vite dev сервер, в другом терминале):**
```powershell
cd frontend
npm install
npm run dev
```

Открой `http://localhost:5173`. Vite проксирует `fetch('api.php?...')` на `localhost:8000` (настроено в `vite.config.ts`).

---

## Деплой на Beget

### 1. Создай MySQL БД в панели Beget

Панель → **Базы данных** → Создать базу.
Запиши: имя БД, пользователь, пароль.

### 2. Пропиши данные БД в `backend/config.php`

```php
return [
    'host'     => 'localhost',
    'dbname'   => 'woodprxn_test',
    'user'     => 'woodprxn_test',
    'password' => 'твой_пароль',
    'charset'  => 'utf8mb4',
];
```

### 3. Собери фронт локально

```powershell
cd frontend
npm run build
```

Готовые файлы будут в `frontend/dist/`.

### 4. Создай сайт в панели Beget

Панель → **Сайты** → Создать сайт → привяжи домен.

### 5. Загрузи файлы в public_html

Через **Файловый менеджер** в панели Beget загрузи в `~/woodprxn.beget.tech/public_html/`:

**Из `frontend/dist/`:**
- `index.html`
- `assets/` (вся папка)

**Из `backend/`:**
- `api.php`
- `db.php`
- `config.php`

Итоговая структура на сервере:
```
public_html/
├── index.html
├── assets/
│   ├── index-XXX.js
│   └── index-XXX.css
├── api.php
├── db.php
└── config.php
```

### 6. Открой сайт

- Нажми **"Инициализировать таблицу"** — создастся таблица `messages`
- Введи текст → **"Отправить в БД"** → запись появится в списке

---

## Обновления

Изменил фронт → `npm run build` → перезалил `index.html` и `assets/` на сервер.
Изменил бэк → перезалил `api.php` / `db.php`.
