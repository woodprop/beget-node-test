import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool } from '@/lib/db'

// Creates the messages table if it doesn't exist yet.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = getPool()
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        text VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    res.status(200).json({ ok: true, message: 'Table ready' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
}
