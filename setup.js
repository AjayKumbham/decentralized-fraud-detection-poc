// setup.js
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = minimist(process.argv.slice(2), {
  default: {
    python: 5000,
    server: 4000,
    client1: 4001,
    client2: 4002,
    client3: 4003,
    install: false,
  }
});

function runCommand(name, cwd, command, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: { ...process.env, ...env },
      stdio: 'inherit',
      detached: false,
    });
    
    child.on('error', (err) => {
      console.error(`[${name}] failed:`, err);
      reject(err);
    });
    
    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[${name}] exited with code ${code}`);
        reject(new Error(`Process exited with code ${code}`));
      } else {
        console.log(`[${name}] completed successfully.`);
        resolve();
      }
    });
  });
}

function runService(name, cwd, command, env = {}) {
  const child = spawn(command, {
    cwd,
    shell: true,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    detached: false,
  });
  child.on('error', (err) => {
    console.error(`[${name}] failed to start:`, err);
  });
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  console.log(`[${name}] started.`);
}

async function main() {
  try {
    // Install dependencies if requested
    if (args.install) {
      console.log('Installing dependencies...');
      
      // Install Python dependencies
      try {
        await runCommand('PythonDeps', path.join(__dirname, 'python-service'), 'pip install -r requirements.txt');
      } catch (error) {
        console.warn('Warning: Failed to install Python dependencies. You may need to install them manually.');
      }
      
      // Install Node.js dependencies
      const nodeDirs = ['server', 'client-1', 'client-2', 'client-3'];
      for (const dir of nodeDirs) {
        try {
          await runCommand(`NodeDeps-${dir}`, path.join(__dirname, dir), 'npm install');
        } catch (error) {
          console.warn(`Warning: Failed to install dependencies for ${dir}`);
        }
      }
    }

    // Start all services
    console.log('Starting all services...');
    
    // Start Python ML Microservice
    runService(
      'PythonService',
      path.join(__dirname, 'python-service'),
      `set PORT=${args.python}&& python app.py`
    );

    // Start Node.js Server
    runService(
      'Server',
      path.join(__dirname, 'server'),
      `set PORT=${args.server}&& npm start`
    );

    // Start Client 1
    runService(
      'Client1',
      path.join(__dirname, 'client-1'),
      `set PORT=${args.client1}&& npm start`
    );

    // Start Client 2
    runService(
      'Client2',
      path.join(__dirname, 'client-2'),
      `set PORT=${args.client2}&& npm start`
    );

    // Start Client 3
    runService(
      'Client3',
      path.join(__dirname, 'client-3'),
      `set PORT=${args.client3}&& npm start`
    );

    console.log('All services launched! Use Ctrl+C to stop.');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

main();