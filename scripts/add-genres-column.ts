import postgres from 'postgres';
import * as fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      const key = l.slice(0, idx).trim();
      const val = l.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      return [key, val];
    })
);

const sql = postgres(env['DATABASE_URL'], { ssl: 'require' });

async function main() {
  await sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS genres jsonb`;
  console.log('Done — genres column added to albums table');
  await sql.end();
}

main().catch(console.error);
