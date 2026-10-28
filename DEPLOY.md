# Деплой на Beget через Git

## Структура проекта

```
node-hosting-test/
├── www/              ← то, что идёт на сервер (= public_html)
│   ├── index.html    ← собирается Vite
│   ├── assets/       ← собирается Vite
│   ├── api.php       ← PHP API (исходник)
│   ├── db.php
│   └── config.php
├── frontend/         ← исходники React (не на сервер)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts  (outDir = ../www, emptyOutDir: false)
└── .gitignore
```

Вся папка `www/` коммитится в git — на сервере она напрямую = `public_html`.

---

## Локальная разработка

**Терминал 1 — PHP бэк:**
```powershell
cd www
php -S localhost:8000
```

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

### 2. Пропиши данные БД в `www/config.php`

```php
return [
    'host'     => 'localhost',
    'dbname'   => 'woodprxn_test',
    'user'     => 'woodprxn_test',
    'password' => 'твой_пароль',
    'charset'  => 'utf8mb4',
];
```

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
TARGET=/home/w/woodprxn/woodprxn.beget.tech/public_html
GIT_DIR=/home/w/woodprxn/repos/node-hosting-test.git

while read oldrev newrev ref; do
    if [[ $ref =~ .*/main$ ]]; then
        echo "Deploying main branch..."
        git --work-tree=/tmp/deploy-$$ --git-dir=$GIT_DIR checkout -f main
        rm -rf $TARGET/*
        cp -r /tmp/deploy-$$/www/* $TARGET/
        rm -rf /tmp/deploy-$$
        echo "Done."
    fi
done
```

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

# Удали дефолтный public_html и сделай симлинк на www/ из репо
rm -rf ~/woodprxn.beget.tech/public_html
ln -s ~/node-hosting-test/www ~/woodprxn.beget.tech/public_html
```

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
