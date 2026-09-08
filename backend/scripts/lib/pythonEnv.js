import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const libDir = path.dirname(fileURLToPath(import.meta.url))
export const scriptsDir = path.resolve(libDir, '..')
export const backendDir = path.resolve(scriptsDir, '..')
export const projectRoot = path.resolve(backendDir, '..')

export const isWindows = process.platform === 'win32'

const venvPythonPath = (...segments) =>
  isWindows
    ? path.join(...segments, 'Scripts', 'python.exe')
    : path.join(...segments, 'bin', 'python')

export const getPythonCommand = (service) => {
  if (service) {
    const serviceDir = { ai: 'ai-service', ml: 'ml-service' }[service] ?? service
    const serviceVenvPython = venvPythonPath(projectRoot, serviceDir, '.venv')
    if (fs.existsSync(serviceVenvPython)) return serviceVenvPython
  }
  const rootVenvPython = venvPythonPath(projectRoot, '.venv')
  if (fs.existsSync(rootVenvPython)) return rootVenvPython
  return process.env.PYTHON || 'python'
}

export const aiTarget = () => ({
  host: process.env.AI_SERVICE_HOST || process.env.AI_HOST || '127.0.0.1',
  port: process.env.AI_SERVICE_PORT || process.env.AI_PORT || '8001',
})

export const mlTarget = () => ({
  host: process.env.ML_SERVICE_HOST || '127.0.0.1',
  port: process.env.ML_SERVICE_PORT || '5000',
})

const children = []

export const spawnService = ({ name, command, args, cwd }) => {
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

  child.on('error', (err) => {
    console.error(`[${name}] failed to start: ${err.message}`)
    if (err.code === 'ENOENT') {
      console.error(
        `[${name}] Python executable not found. Set PYTHON=<path-to-python> or create <projectRoot>/.venv.`
      )
    }
    shutdown(1)
  })

  children.push(child)
  return child
}

export const shutdown = (exitCode = 0) => {
  for (const child of children) {
    if (!child.killed) {
      child.kill()
    }
  }
  process.exit(exitCode)
}

export const registerSignalHandlers = () => {
  process.on('SIGINT', () => shutdown(0))
  process.on('SIGTERM', () => shutdown(0))
}
