import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverDir = path.resolve(__dirname, '..')
const projectRoot = path.resolve(serverDir, '..')

const children = []

const getPythonCommand = () => {
  const venvPython = path.join(projectRoot, '.venv', 'Scripts', 'python.exe')
  if (fs.existsSync(venvPython)) return venvPython
  return process.env.PYTHON || 'python'
}

const python = getPythonCommand()

const spawnService = ({ name, command, args, cwd }) => {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  })

  child.on('exit', (code, signal) => {
    const status = signal ? `signal ${signal}` : `code ${code}`
    console.log(`[${name}] exited with ${status}`)
    if (code !== 0 && signal !== 'SIGTERM') {
      shutdown(1)
    }
  })

  children.push(child)
  return child
}

const shutdown = (exitCode = 0) => {
  for (const child of children) {
    if (!child.killed) {
      child.kill()
    }
  }
  process.exit(exitCode)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

spawnService({
  name: 'api',
  command: process.execPath,
  args: ['server.js'],
  cwd: serverDir,
})

spawnService({
  name: 'ai-service',
  command: python,
  args: ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
  cwd: path.join(projectRoot, 'ai-service'),
})

spawnService({
  name: 'ml-service',
  command: python,
  args: ['app.py'],
  cwd: path.join(projectRoot, 'ml-service'),
})

console.log('Started API, AI service, and ML service from npm run server')
