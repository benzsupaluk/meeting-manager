import type { Pool } from 'pg';

/** Ordered, append-only list of schema migrations. Never edit an applied migration. */
const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: '001_init',
    sql: `
      CREATE TABLE users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email         TEXT NOT NULL,
        name          TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX users_email_key ON users (lower(email));

      CREATE TABLE candidates (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            TEXT NOT NULL,
        position        TEXT NOT NULL,
        email           TEXT,
        interview_notes TEXT NOT NULL DEFAULT '',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX candidates_name_position_key ON candidates (lower(name), position);

      CREATE TABLE meetings (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        title        TEXT NOT NULL,
        description  TEXT NOT NULL DEFAULT '',
        start_at     TIMESTAMPTZ NOT NULL,
        end_at       TIMESTAMPTZ NOT NULL,
        type         TEXT NOT NULL CHECK (type IN ('onsite', 'zoom', 'google_meet')),
        location     TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (end_at > start_at)
      );
      CREATE INDEX meetings_start_at_idx ON meetings (start_at);
      CREATE INDEX meetings_candidate_id_idx ON meetings (candidate_id);

      CREATE TABLE feedback (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        meeting_id   UUID REFERENCES meetings(id) ON DELETE SET NULL,
        author_name  TEXT NOT NULL,
        rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment      TEXT NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX feedback_candidate_id_idx ON feedback (candidate_id);
    `,
  },
];

export async function runMigrations(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    // Serialise concurrent boots (e.g. multiple replicas) with an advisory lock.
    await client.query('SELECT pg_advisory_lock(424242)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    );
    const { rows } = await client.query<{ id: string }>('SELECT id FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.id));

    for (const migration of MIGRATIONS.filter((m) => !applied.has(m.id))) {
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
        await client.query('COMMIT');
        console.log(`[db] applied migration ${migration.id}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(424242)').catch(() => {});
    client.release();
  }
}
