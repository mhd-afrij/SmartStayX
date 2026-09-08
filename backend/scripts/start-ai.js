import path from 'node:path'
import 'dotenv/config'
import {
  aiTarget,
  getPythonCommand,
  isWindows,
  projectRoot,
  registerSignalHandlers,
  spawnService,
} from './lib/pythonEnv.js'

const { host, port } = aiTarget()
const useAiReload = process.env.AI_SERVICE_RELOAD
  ? process.env.AI_SERVICE_RELOAD !== 'false'
  : !isWindows

registerSignalHandlers()

spawnService({
  name: 'ai-service',
  command: getPythonCommand('ai'),
  args: [
    '-m',
    'uvicorn',
    'app.main:app',
    '--host',
    host,
    '--port',
    port,
    ...(useAiReload ? ['--reload'] : []),
  ],
  cwd: path.join(projectRoot, 'ai-service'),
})

console.log(`[ai-service] http://${host}:${port} (docs: http://${host}:${port}/docs)`)
