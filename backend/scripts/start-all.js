import path from 'node:path'
import 'dotenv/config'
import {
  aiTarget,
  backendDir,
  getPythonCommand,
  isWindows,
  mlTarget,
  projectRoot,
  registerSignalHandlers,
  spawnService,
} from './lib/pythonEnv.js'

const serverDir = backendDir

const ai = aiTarget()
const ml = mlTarget()
const useAiReload = process.env.AI_SERVICE_RELOAD
  ? process.env.AI_SERVICE_RELOAD !== 'false'
  : !isWindows

registerSignalHandlers()

spawnService({
  name: 'api',
  command: process.execPath,
  args: ['server.js'],
  cwd: serverDir,
})

spawnService({
  name: 'ai-service',
  command: getPythonCommand('ai'),
  args: [
    '-m',
    'uvicorn',
    'app.main:app',
    '--host',
    ai.host,
    '--port',
    ai.port,
    ...(useAiReload ? ['--reload'] : []),
  ],
  cwd: path.join(projectRoot, 'ai-service'),
})

spawnService({
  name: 'ml-service',
  command: getPythonCommand('ml'),
  args: isWindows
    ? ['app.py']
    : ['-m', 'gunicorn', '--bind', `${ml.host}:${ml.port}`, 'app:app'],
  cwd: path.join(projectRoot, 'ml-service'),
})

console.log('Started API, AI service, and ML service from npm run server')
