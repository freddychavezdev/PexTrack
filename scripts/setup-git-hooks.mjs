import { execFileSync } from 'node:child_process'

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' })
  console.log('Git hooks configured: .githooks')
} catch {
  console.warn('Git hooks could not be configured. Run: git config core.hooksPath .githooks')
}
