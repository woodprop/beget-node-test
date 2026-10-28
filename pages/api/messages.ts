import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool } from '@/lib/db'

export type Message = { id: number; text: string; created_at: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pool = getPool()

  if (req.method === 'POST') {
    const { text } = req.body as { text?: string }
    if (!text?.trim()) {
      return res.status(400).json({ ok: false, error: 'text is required' })
    }
    try {
      await pool.execute('INSERT INTO messages (text) VALUES (?)', [text.trim()])
      return res.status(201).json({ ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return res.status(500).json({ ok: false, error: message })
    }
  }

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.execute('SELECT id, text, created_at FROM messages ORDER BY id DESC LIMIT 20')
      return res.status(200).json({ ok: true, messages: rows })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return res.status(500).json({ ok: false, error: message })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).json({ ok: false, error: 'Method not allowed' })
}
