# Деплой на Beget (виртуальный хостинг)

**Механизм:** Apache mod_passenger — Node.js запускается через `.htaccess`, без PM2 и Nginx-proxy.

---

## 1. Создай MySQL БД в панели Beget

Панель → Базы данных → Создать базу данных.  
Запиши: хост, имя БД, пользователь, пароль.

---

## 2. Создай сайт и домен в панели Beget

Панель → Сайты → Создать сайт → привяжи домен (NS-серверы должны указывать на Beget).  
Beget создаст каталог `~/имя_сайта/public_html`. Он нам понадобится позже.

---

## 3. Подключись по SSH и войди в Docker-окружение

На Beget Node.js работает **только внутри Docker-контейнера**:

```bash
# Обычный SSH:
ssh username@username.beget.tech

# Войти в Docker (обязательно!):
ssh localhost -p 222
```

Все дальнейшие команды — внутри этого Docker-контейнера.

---

## 4. Установи Node.js в ~/.local

Проверь версию Ubuntu (влияет на максимальную версию Node.js):
```bash
cat /etc/os-release
# Ubuntu 22.04 → можно до v24
# Ubuntu 18.04 → максимум v17.9.1, или используй сборку Beget (v18–21)
```

Установка (пример для Ubuntu 22.04, Node.js v20):
```bash
mkdir -p ~/.local && cd ~/.local

# Скачай нужную версию с nodejs.org:
wget https://nodejs.org/dist/v20.19.0/node-v20.19.0-linux-x64.tar.gz

# Распакуй прямо в .local:
tar -xzf node-v20.19.0-linux-x64.tar.gz --strip 1

# Проверь:
~/.local/bin/node -v
~/.local/bin/npm -v

# Удали архив:
rm node-v20.19.0-linux-x64.tar.gz
```

Добавь в `~/.bashrc` для удобства:
```bash
echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

> Если Ubuntu 18.04 и нужен Node 18+, используй сборки Beget.  
> Подробнее: https://beget.com/ru/kb/how-to/web-apps/node-js

---

## 5. Загрузи проект на сервер

```bash
# Вариант 1 — через SCP (с локальной машины):
scp -r ./node-hosting-test username@username.beget.tech:~/myapp

# Вариант 2 — через Git (внутри Docker):
cd ~
git clone https://github.com/yourname/node-hosting-test.git myapp
```

---

## 6. Установи зависимости и собери

```bash
cd ~/myapp
npm install
npm run build
```

---

## 7. Создай .env.local

```bash
cat > ~/myapp/.env.local << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_USER=beget_db_user
DB_PASSWORD=your_password
DB_NAME=beget_db_name
EOF
```

---

## 8. Создай .htaccess

```bash
cat > ~/myapp/.htaccess << 'EOF'
PassengerNodejs /home/USERNAME/.local/bin/node
PassengerAppRoot /home/USERNAME/myapp
PassengerAppType node
PassengerStartupFile server.js
EOF
```

Замени `USERNAME` на свой логин Beget и `myapp` на реальный путь.

---

## 9. Настрой public_html

Beget отдаёт статику через Nginx. `public_html` должен вести на папку `public` твоего проекта:

```bash
# Удали дефолтный public_html (он пустой или со страницей-заглушкой):
rm -rf ~/имя_сайта/public_html

# Создай симлинк на папку public проекта:
ln -s ~/myapp/public ~/имя_сайта/public_html
```

---

## 10. Создай папку tmp

Passenger использует её для управления перезапуском:

```bash
mkdir -p ~/myapp/tmp
touch ~/myapp/tmp/restart.txt
```

---

## 11. Проверка

Открой сайт в браузере. Passenger запустит приложение при первом запросе (может быть пауза ~5 сек).

- Нажать "Инициализировать таблицу" → статус "БД готова"
- Ввести текст → "Отправить в БД" → запись появляется в списке

---

## Перезапуск приложения (после обновления кода)

```bash
cd ~/myapp
npm run build
touch tmp/restart.txt   # Passenger перезапустит процесс при следующем запросе
```

---

## Автозапуск после перезагрузки сервера

**Ничего делать не нужно.** Passenger управляется Apache, который стартует автоматически со всеми серверными службами. При первом запросе к сайту после перезагрузки Passenger сам поднимет Node.js процесс.
