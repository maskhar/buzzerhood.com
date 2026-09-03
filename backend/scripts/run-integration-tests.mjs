import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '../..');
const name = `buzzerhood-b3-test-${Date.now()}`;
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: options.input ? ['pipe', 'pipe', 'pipe'] : 'pipe', input: options.input });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  return (result.stdout ?? '').trim();
}
function psql(database, sql) { run('docker', ['exec', '-i', name, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database], { input: sql }); }
function migrations(from, to) {
  return readdirSync(resolve(root, 'database/migrations')).filter((file) => /^\d{4}.*\.sql$/.test(file))
    .filter((file) => Number(file.slice(0, 4)) >= from && Number(file.slice(0, 4)) <= to).sort();
}
function apply(database, files) { for (const file of files) psql(database, readFileSync(resolve(root, 'database/migrations', file), 'utf8')); }
try {
  run('docker', ['run', '--detach', '--rm', '--name', name, '-e', 'POSTGRES_PASSWORD=integration_postgres_password', '-p', '127.0.0.1::5432', 'postgres:17-bookworm']);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const ready = spawnSync('docker', ['exec', name, 'pg_isready', '-U', 'postgres'], { encoding: 'utf8' });
    if (ready.status === 0) break;
    if (attempt === 29) throw new Error('Disposable PostgreSQL did not become ready.');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }
  run('docker', ['exec', name, 'createdb', '-U', 'postgres', 'fresh']);
  run('docker', ['exec', name, 'createdb', '-U', 'postgres', 'upgrade']);
  const bootstrap = readFileSync(resolve(import.meta.dirname, '../test/fixtures/bootstrap.sql'), 'utf8');
  const latest = Math.max(...migrations(1, 9999).map((file) => Number(file.slice(0, 4))));
  psql('fresh', bootstrap); apply('fresh', migrations(1, latest));
  psql('upgrade', bootstrap); apply('upgrade', migrations(1, 17)); apply('upgrade', migrations(18, latest));
  const port = run('docker', ['port', name, '5432/tcp']).split(':').at(-1);
  const env = { ...process.env, TEST_DATABASE_URL: `postgresql://buzzerhood_app:integration_app_password@127.0.0.1:${port}/upgrade`, TEST_ADMIN_DATABASE_URL: `postgresql://postgres:integration_postgres_password@127.0.0.1:${port}/upgrade` };
  const tests = spawnSync(process.execPath, [resolve(import.meta.dirname, '../node_modules/vitest/vitest.mjs'), 'run', '--config', resolve(import.meta.dirname, '../vitest.integration.config.ts')], { stdio: 'inherit', env });
  if (tests.status !== 0) process.exitCode = tests.status ?? 1;
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1;
} finally {
  spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore' });
}
