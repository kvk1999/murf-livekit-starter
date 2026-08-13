import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

function getDbPath(): string {
  return path.resolve(process.cwd(), '..', 'backend', 'caller_memory.db');
}

async function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const initSqlJs = require('sql.js');
  const wasmPath = path.resolve(
    process.cwd(),
    'node_modules',
    'sql.js',
    'dist',
    'sql-wasm.wasm'
  );
  const SQL = await initSqlJs({ locateFile: () => wasmPath });

  const dbPath = getDbPath();
  let db: any;

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS escalations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      call_id TEXT,
      user_id TEXT,
      issue_type TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return { db, dbPath };
}

function saveDb(db: any, dbPath: string) {
  try {
    const data: Uint8Array = db.export();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (e) {
    console.error('[saveDb escalations] Failed to persist DB:', e);
  }
}

function queryAll(db: any, sql: string, params: any[] = []): any[] {
  const results: any[] = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export async function GET() {
  try {
    const { db } = await getDb();

    const rows = queryAll(
      db,
      `SELECT id, call_id, user_id, issue_type, description, status, priority, created_at, updated_at
       FROM escalations
       ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC
       LIMIT 50`
    );

    const open = rows.filter((r) => r.status === 'open').length;
    const inProgress = rows.filter((r) => r.status === 'in_progress').length;
    const resolved = rows.filter((r) => r.status === 'resolved').length;

    db.close();
    return NextResponse.json(
      { escalations: rows, summary: { open, in_progress: inProgress, resolved } },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    console.error('[/api/escalations GET] Error:', err);
    return NextResponse.json(
      { escalations: [], summary: { open: 0, in_progress: 0, resolved: 0 }, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { call_id, user_id, issue_type, description, priority } = body;
    if (!issue_type) {
      return NextResponse.json({ error: 'issue_type is required' }, { status: 400 });
    }
    const { db, dbPath } = await getDb();
    db.run(
      `INSERT INTO escalations (call_id, user_id, issue_type, description, priority) VALUES (?, ?, ?, ?, ?)`,
      [call_id ?? null, user_id ?? 'guest', issue_type, description ?? '', priority ?? 'medium']
    );
    saveDb(db, dbPath);
    db.close();
    return NextResponse.json({ status: 'created' });
  } catch (err: any) {
    console.error('[/api/escalations POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }
    const { db, dbPath } = await getDb();
    db.run(
      `UPDATE escalations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, id]
    );
    saveDb(db, dbPath);
    db.close();
    return NextResponse.json({ status: 'updated' });
  } catch (err: any) {
    console.error('[/api/escalations PATCH] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
