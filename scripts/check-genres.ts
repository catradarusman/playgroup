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
  const rows = await sql`SELECT id, title, artist, genres FROM albums ORDER BY created_at DESC LIMIT 10`;
  console.log('Recent albums and their genres:');
  for (const row of rows) {
    console.log(`  ${row.title} — ${row.artist}: ${JSON.stringify(row.genres)}`);
  }
  await sql.end();
}

main().catch(console.error);
