import path from 'node:path'
import 'dotenv/config'
import {
  getPythonCommand,
  isWindows,
  mlTarget,
  projectRoot,
  registerSignalHandlers,
  spawnService,
} from './lib/pythonEnv.js'

const { host, port } = mlTarget()

registerSignalHandlers()

spawnService({
  name: 'ml-service',
  command: getPythonCommand('ml'),
  args: isWindows
    ? ['app.py']
    : ['-m', 'gunicorn', '--bind', `${host}:${port}`, 'app:app'],
  cwd: path.join(projectRoot, 'ml-service'),
})

console.log(`[ml-service] http://${host}:${port} (health: http://${host}:${port}/health)`)
