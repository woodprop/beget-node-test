import { useState, useEffect, FormEvent } from 'react'

type Message = { id: number; text: string; created_at: string }

export default function Home() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState('')
  const [dbReady, setDbReady] = useState(false)

  async function initDb() {
    const res = await fetch('/api/init')
    const data = await res.json()
    if (data.ok) {
      setDbReady(true)
      setStatus('БД готова')
      loadMessages()
    } else {
      setStatus('Ошибка инициализации БД: ' + data.error)
    }
  }

  async function loadMessages() {
    const res = await fetch('/api/messages')
    const data = await res.json()
    if (data.ok) setMessages(data.messages)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setStatus('Отправка...')
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    const data = await res.json()
    if (data.ok) {
      setText('')
      setStatus('Сохранено!')
      loadMessages()
    } else {
      setStatus('Ошибка: ' + data.error)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 8 }}>Тест Next.js → MySQL</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Beget hosting connectivity check
      </p>

      {!dbReady && (
        <div style={{ marginBottom: 24 }}>
          <button onClick={initDb} style={btnStyle('#0070f3')}>
            Инициализировать таблицу в БД
          </button>
          <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            Нажми один раз — создаёт таблицу <code>messages</code>, если её нет
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
          Введи текст
        </label>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Любой текст..."
          style={inputStyle}
        />
        <button type="submit" style={btnStyle('#0070f3')} disabled={!text.trim()}>
          Отправить в БД
        </button>
        {status && (
          <p style={{ marginTop: 8, color: status.startsWith('Ошибка') ? '#c00' : '#070' }}>
            {status}
          </p>
        )}
      </form>

      <h2 style={{ marginBottom: 12 }}>Из базы данных (последние 20)</h2>
      {messages.length === 0 ? (
        <p style={{ color: '#999' }}>Нет записей</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {messages.map(m => (
            <li key={m.id} style={rowStyle}>
              <span style={{ color: '#999', fontSize: 12, marginRight: 8 }}>#{m.id}</span>
              <span style={{ flex: 1 }}>{m.text}</span>
              <span style={{ color: '#999', fontSize: 12 }}>
                {new Date(m.created_at).toLocaleString('ru-RU')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 12px',
  fontSize: 16,
  border: '1px solid #ccc',
  borderRadius: 6,
  marginBottom: 10,
  boxSizing: 'border-box',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 0',
  borderBottom: '1px solid #eee',
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '10px 20px',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 15,
    cursor: 'pointer',
  }
}
