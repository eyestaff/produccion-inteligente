import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function spawnProcess(args) {
  return spawn(npmCommand, args, {
    stdio: 'inherit',
    shell: false,
  });
}

const frontend = spawnProcess(['run', 'dev:frontend']);
const worker = spawnProcess(['run', 'dev:worker']);

function stopAll(code = 0) {
  frontend.kill('SIGTERM');
  worker.kill('SIGTERM');
  process.exit(code);
}

frontend.on('exit', (code, signal) => {
  if (signal) {
    stopAll(0);
    return;
  }
  stopAll(code ?? 0);
});

worker.on('exit', (code, signal) => {
  if (signal) {
    stopAll(0);
    return;
  }
  stopAll(code ?? 0);
});

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
