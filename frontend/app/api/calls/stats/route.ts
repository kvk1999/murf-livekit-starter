import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

function getDbPath(): string {
  return path.resolve(process.cwd(), '..', 'backend', 'caller_memory.db');
}

async function getDb() {
  // sql.js is a pure-WASM SQLite port — no native compilation required
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  const dbPath = getDbPath();
  let db: any;

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    // DB doesn't exist yet — create an empty in-memory DB with the schema
    db = new SQL.Database();
  }

  // Ensure tables exist
  db.run(`
    CREATE TABLE IF NOT EXISTS callers (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        language_preference TEXT,
        facts TEXT,
        last_interaction TEXT
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS call_outcomes (
        call_id TEXT PRIMARY KEY,
        room_name TEXT,
        start_time TEXT,
        end_time TEXT,
        outcome TEXT NOT NULL,
        reason TEXT,
        user_id TEXT,
        turns INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return { db, SQL, dbPath };
}

function querySingle(db: any, sql: string, params: any[] = []): any {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
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

function saveDb(db: any, dbPath: string) {
  try {
    const data: Uint8Array = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (e) {
    console.error('[saveDb] Failed to persist DB:', e);
  }
}

export async function GET() {
  try {
    const { db, dbPath } = await getDb();

    const totalRow = querySingle(db, 'SELECT COUNT(*) as cnt FROM call_outcomes');
    const successRow = querySingle(
      db,
      "SELECT COUNT(*) as cnt FROM call_outcomes WHERE LOWER(outcome) = 'success'"
    );
    const failedRow = querySingle(
      db,
      "SELECT COUNT(*) as cnt FROM call_outcomes WHERE LOWER(outcome) = 'failed'"
    );

    const totalCalls = Number(totalRow?.cnt ?? 0);
    const successfulCalls = Number(successRow?.cnt ?? 0);
    const failedCalls = Number(failedRow?.cnt ?? 0);
    const successRate =
      totalCalls > 0 ? Number(((successfulCalls / totalCalls) * 100).toFixed(1)) : 0;

    const historyRows = queryAll(
      db,
      `SELECT call_id, room_name, start_time, end_time, outcome, reason, user_id, turns, created_at
       FROM call_outcomes
       ORDER BY created_at DESC
       LIMIT 20`
    );

    // Step 6: Privacy — mask user_id, never expose transcripts / PINs / OTPs
    const sanitizedHistory = historyRows.map((row) => ({
      call_id: row.call_id,
      room_name: row.room_name,
      start_time: row.start_time,
      end_time: row.end_time,
      outcome: row.outcome,
      reason: row.reason || 'General inquiry',
      user_id: row.user_id ? `${String(row.user_id).slice(0, 3)}***` : 'gue***',
      turns: Number(row.turns ?? 0),
      created_at: row.created_at,
    }));

    db.close();

    return NextResponse.json(
      {
        total_calls: totalCalls,
        successful_calls: successfulCalls,
        failed_calls: failedCalls,
        success_rate: successRate,
        history: sanitizedHistory,
        policy:
          'SUCCESSFUL = at least 1 interactive turn completed without error. FAILED = early disconnect or session error.',
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    console.error('[/api/calls/stats GET] Error:', err);
    return NextResponse.json(
      {
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        success_rate: 0,
        history: [],
        error: err.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { call_id, outcome, reason, turns, room_name, user_id } = body;

    if (!call_id || !outcome) {
      return NextResponse.json({ error: 'call_id and outcome are required' }, { status: 400 });
    }

    const { db, dbPath } = await getDb();

    const nowIso = new Date().toISOString();
    const normalizedOutcome = String(outcome).toLowerCase() === 'success' ? 'success' : 'failed';

    const existing = querySingle(
      db,
      'SELECT call_id FROM call_outcomes WHERE call_id = ?',
      [call_id]
    );

    if (existing) {
      db.run(
        `UPDATE call_outcomes SET end_time = ?, outcome = ?, reason = ?, turns = ? WHERE call_id = ?`,
        [nowIso, normalizedOutcome, reason ?? '', turns ?? 0, call_id]
      );
    } else {
      db.run(
        `INSERT INTO call_outcomes (call_id, room_name, start_time, end_time, outcome, reason, user_id, turns)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          call_id,
          room_name ?? 'browser_call',
          nowIso,
          nowIso,
          normalizedOutcome,
          reason ?? '',
          user_id ?? 'guest',
          turns ?? 0,
        ]
      );
    }

    saveDb(db, dbPath);
    db.close();

    return NextResponse.json({ status: 'success', call_id, outcome: normalizedOutcome });
  } catch (err: any) {
    console.error('[/api/calls/stats POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
