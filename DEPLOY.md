# Деплой на Beget через Git

## Структура проекта

```
node-hosting-test/
├── www/              ← веб-корень (= public_html на сервере)
│   ├── index.html    ← собирается Vite
│   ├── assets/       ← собирается Vite
│   └── api.php       ← единственный PHP в веб-корне
├── lib/              ← PHP вне веб-корня (с секретами)
│   ├── db.php
│   └── config.php    ← пароль БД — не доступен по URL
├── frontend/         ← исходники React
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── .gitignore
```

Почему `lib/` отдельно: если PHP упадёт/отключится, файлы из `www/` отдадутся как plain text. Поэтому `config.php` с паролем БД лежит вне веб-корня. `api.php` подключает `../lib/db.php` через `require`.

На сервере:
- `~/woodprxn.beget.tech/public_html/` ← содержимое `www/`
- `~/woodprxn.beget.tech/lib/` ← содержимое `lib/` (на уровень выше веб-корня)

---

## Локальная разработка

**Терминал 1 — PHP бэк:**
```powershell
php -S localhost:8000 -t www
```
Запуск из корня проекта: флаг `-t www` указывает веб-корень, а `../lib/` доступен скрипту через `require`.

**Терминал 2 — React фронт (hot reload):**
```powershell
cd frontend
npm install        # первый раз
npm run dev
```

Открой `http://localhost:5173`. Vite проксирует `fetch('api.php?...')` на `localhost:8000`.

---

## Подготовка к первому деплою

### 1. Создай MySQL БД в панели Beget

Панель → **Базы данных** → Создать базу.

### 2. Создай локальный конфиг БД

В репе лежит `lib/config.example.php` — шаблон. Скопируй его как `lib/config.php` и впиши данные:

```powershell
Copy-Item lib\config.example.php lib\config.php
```

Отредактируй `lib/config.php`:
```php
return [
    'host'     => 'localhost',
    'dbname'   => 'woodprxn_test',
    'user'     => 'woodprxn_test',
    'password' => 'твой_пароль',
    'charset'  => 'utf8mb4',
];
```

**`lib/config.php` в `.gitignore`** — секреты в репу не попадают. На сервере тоже нужно создать `lib/config.php` вручную (post-receive hook не затирает его).

### 3. Создай сайт в панели Beget

Панель → **Сайты** → Создать сайт → привяжи домен.

---

## Настройка git-деплоя на Beget

### Вариант А — Git-репозиторий прямо на Beget (push to deploy)

Это проще всего, если репа только у тебя.

**На сервере (обычный SSH, не Docker):**
```bash
# Создай bare-репо
mkdir -p ~/repos
cd ~/repos
git init --bare node-hosting-test.git

# Создай post-receive hook
nano node-hosting-test.git/hooks/post-receive
```

Содержимое hook'а:
```bash
#!/bin/bash
SITE_ROOT=/home/w/woodprxn/woodprxn.beget.tech
PUBLIC=$SITE_ROOT/public_html
LIB=$SITE_ROOT/lib
GIT_DIR=/home/w/woodprxn/repos/node-hosting-test.git

while read oldrev newrev ref; do
    if [[ $ref =~ .*/main$ ]]; then
        echo "Deploying main branch..."
        TMP=/tmp/deploy-$$
        git --work-tree=$TMP --git-dir=$GIT_DIR checkout -f main

        # Веб-корень
        rm -rf $PUBLIC/*
        cp -r $TMP/www/* $PUBLIC/

        # Приватная папка — конфиги с секретами
        # ВАЖНО: не затираем lib/config.php, если он уже отредактирован на сервере
        mkdir -p $LIB
        cp -n $TMP/lib/config.php $LIB/   # -n = не перезаписывать существующий
        cp $TMP/lib/db.php $LIB/

        rm -rf $TMP
        echo "Done."
    fi
done
```

Логика деплоя `lib/`:
- `db.php` — обновляется (это код)
- `config.php` — **копируется только если его ещё нет** (чтобы не затереть пароли БД, которые ты вписал на сервере)

```bash
chmod +x node-hosting-test.git/hooks/post-receive
```

**Локально:**
```bash
git remote add beget woodprxn@woodprxn.beget.tech:/home/w/woodprxn/repos/node-hosting-test.git
git push beget main
```

При каждом `git push beget main` файлы из `www/` автоматически оказываются в `public_html`.

---

### Вариант Б — Деплой через GitHub + клонирование на Beget

Если репа уже на GitHub и хочешь pull-модель.

**На сервере:**
```bash
cd ~
git clone https://github.com/youruser/node-hosting-test.git

# Симлинк веб-корня на www/ из репо
rm -rf ~/woodprxn.beget.tech/public_html
ln -s ~/node-hosting-test/www ~/woodprxn.beget.tech/public_html

# Симлинк lib (нужно вне веб-корня, но доступно из api.php через ../lib)
ln -s ~/node-hosting-test/lib ~/woodprxn.beget.tech/lib
```

**Пропиши пароль БД** в `~/node-hosting-test/lib/config.php` (можно отредактировать прямо на сервере — но тогда git будет показывать diff; альтернатива — хранить `config.php` вне git и ссылаться на локальный файл через симлинк).

**Для обновления:**
```bash
cd ~/node-hosting-test
git pull
```

Или настрой cron на `git pull` раз в N минут, либо webhook с GitHub.

---

## Workflow

```bash
# изменил код фронта или бэка
cd frontend
npm run build         # собирает React в ../www/

cd ..
git add .
git commit -m "..."
git push beget main   # или git push origin main при варианте Б
```

Сайт обновлён.
