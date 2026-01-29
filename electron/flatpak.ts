import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

const execAsync = promisify(exec)

export interface InstalledApp {
  id: string
  name: string
  version: string
  size: string
  origin: string
}

export interface AppUpdate {
  id: string
  currentVersion: string
  newVersion: string
}

export class FlatpakManager {
  private installationPath: string

  constructor() {
    // Use persistent volume for Flatpak installation
    this.installationPath = process.env.FLATPAK_USER_DIR || '/clawdbot_home/apps/flatpak'
  }

  private get flatpakEnv() {
    return {
      ...process.env,
      FLATPAK_USER_DIR: this.installationPath,
    }
  }

  async ensureFlathubRemote(): Promise<void> {
    try {
      await execAsync(
        'flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo',
        { env: this.flatpakEnv }
      )
    } catch (error) {
      console.error('Failed to add Flathub remote:', error)
    }
  }

  async listInstalled(): Promise<InstalledApp[]> {
    try {
      const { stdout } = await execAsync(
        'flatpak list --user --columns=application,name,version,size,origin',
        { env: this.flatpakEnv }
      )

      return stdout
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [id, name, version, size, origin] = line.split('\t')
          return { id, name, version, size, origin }
        })
    } catch {
      return []
    }
  }

  async install(appId: string, onProgress?: (progress: number) => void): Promise<void> {
    await this.ensureFlathubRemote()

    return new Promise((resolve, reject) => {
      const process = spawn('flatpak', ['install', '--user', '-y', 'flathub', appId], {
        env: this.flatpakEnv,
      })

      let lastProgress = 0

      process.stdout.on('data', (data: Buffer) => {
        const output = data.toString()
        // Parse progress from Flatpak output (e.g., "Downloading ... 45%")
        const match = output.match(/(\d+)%/)
        if (match && onProgress) {
          const progress = parseInt(match[1], 10)
          if (progress > lastProgress) {
            lastProgress = progress
            onProgress(progress)
          }
        }
      })

      process.stderr.on('data', (data: Buffer) => {
        console.error('Flatpak stderr:', data.toString())
      })

      process.on('close', (code) => {
        if (code === 0) {
          onProgress?.(100)
          resolve()
        } else {
          reject(new Error(`Flatpak install failed with code ${code}`))
        }
      })

      process.on('error', reject)
    })
  }

  async installFromBundle(bundleUrl: string, onProgress?: (progress: number) => void): Promise<void> {
    const tempDir = '/tmp/cargstore-downloads'
    const fileName = path.basename(new URL(bundleUrl).pathname)
    const filePath = path.join(tempDir, fileName)

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Download the bundle with progress
    await this.downloadFile(bundleUrl, filePath, (downloadProgress) => {
      // Download is 0-50%, install is 50-100%
      onProgress?.(Math.floor(downloadProgress * 0.5))
    })

    // Install the bundle
    return new Promise((resolve, reject) => {
      const process = spawn('flatpak', ['install', '--user', '-y', '--bundle', filePath], {
        env: this.flatpakEnv,
      })

      let lastProgress = 50

      process.stdout.on('data', (data: Buffer) => {
        const output = data.toString()
        const match = output.match(/(\d+)%/)
        if (match && onProgress) {
          const progress = 50 + Math.floor(parseInt(match[1], 10) * 0.5)
          if (progress > lastProgress) {
            lastProgress = progress
            onProgress(progress)
          }
        }
      })

      process.stderr.on('data', (data: Buffer) => {
        console.error('Flatpak bundle stderr:', data.toString())
      })

      process.on('close', (code) => {
        // Clean up downloaded file
        try {
          fs.unlinkSync(filePath)
        } catch {
          // Ignore cleanup errors
        }

        if (code === 0) {
          onProgress?.(100)
          resolve()
        } else {
          reject(new Error(`Flatpak bundle install failed with code ${code}`))
        }
      })

      process.on('error', reject)
    })
  }

  private downloadFile(url: string, dest: string, onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest)
      const protocol = url.startsWith('https') ? https : http

      const request = protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            file.close()
            fs.unlinkSync(dest)
            this.downloadFile(redirectUrl, dest, onProgress).then(resolve).catch(reject)
            return
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`))
          return
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10)
        let downloadedSize = 0

        response.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length
          if (totalSize > 0 && onProgress) {
            onProgress(Math.floor((downloadedSize / totalSize) * 100))
          }
        })

        response.pipe(file)

        file.on('finish', () => {
          file.close()
          resolve()
        })
      })

      request.on('error', (err) => {
        fs.unlink(dest, () => {})
        reject(err)
      })

      file.on('error', (err) => {
        fs.unlink(dest, () => {})
        reject(err)
      })
    })
  }

  async uninstall(appId: string): Promise<void> {
    await execAsync(`flatpak uninstall --user -y ${appId}`, { env: this.flatpakEnv })
  }

  async launch(appId: string): Promise<void> {
    spawn('flatpak', ['run', appId], {
      env: this.flatpakEnv,
      detached: true,
      stdio: 'ignore',
    }).unref()
  }

  async checkUpdates(): Promise<AppUpdate[]> {
    try {
      const { stdout } = await execAsync(
        'flatpak remote-ls --user --updates --columns=application,installed-version,available-version',
        { env: this.flatpakEnv }
      )

      return stdout
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [id, currentVersion, newVersion] = line.split('\t')
          return { id, currentVersion, newVersion }
        })
    } catch {
      return []
    }
  }

  async update(appId: string): Promise<void> {
    await execAsync(`flatpak update --user -y ${appId}`, { env: this.flatpakEnv })
  }

  async updateAll(): Promise<void> {
    await execAsync('flatpak update --user -y', { env: this.flatpakEnv })
  }
}
