import WebSocket from 'ws'

interface ClawdbotTool {
  name: string
  description: string
  parameters: Record<string, string>
}

interface ClawdbotMessage {
  type: string
  tool?: string
  parameters?: Record<string, unknown>
  result?: unknown
}

export class ClawdbotClient {
  private ws: WebSocket | null = null
  private reconnectInterval: NodeJS.Timeout | null = null
  private handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>> = new Map()

  constructor(private gatewayUrl: string = 'ws://localhost:18789') {
    this.registerDefaultHandlers()
  }

  private registerDefaultHandlers() {
    // These handlers will be called when Clawdbot invokes app store tools
    this.handlers.set('app_store_search', async (params) => {
      const { query } = params as { query: string }
      // Search will be handled by the renderer process
      return { status: 'search_initiated', query }
    })

    this.handlers.set('app_store_install', async (params) => {
      const { app_name } = params as { app_name: string }
      return { status: 'install_initiated', app_name }
    })

    this.handlers.set('app_store_uninstall', async (params) => {
      const { app_name } = params as { app_name: string }
      return { status: 'uninstall_initiated', app_name }
    })

    this.handlers.set('app_store_launch', async (params) => {
      const { app_name } = params as { app_name: string }
      return { status: 'launch_initiated', app_name }
    })

    this.handlers.set('app_store_list_installed', async () => {
      return { status: 'list_initiated' }
    })
  }

  connect() {
    try {
      this.ws = new WebSocket(this.gatewayUrl)

      this.ws.on('open', () => {
        console.log('Connected to Clawdbot Gateway')
        this.registerTools()
      })

      this.ws.on('message', async (data) => {
        try {
          const message: ClawdbotMessage = JSON.parse(data.toString())
          await this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse Clawdbot message:', error)
        }
      })

      this.ws.on('close', () => {
        console.log('Disconnected from Clawdbot Gateway')
        this.scheduleReconnect()
      })

      this.ws.on('error', (error) => {
        console.error('Clawdbot WebSocket error:', error)
      })
    } catch (error) {
      console.error('Failed to connect to Clawdbot Gateway:', error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) return

    this.reconnectInterval = setInterval(() => {
      console.log('Attempting to reconnect to Clawdbot Gateway...')
      this.connect()
    }, 5000)
  }

  private registerTools() {
    const tools: ClawdbotTool[] = [
      {
        name: 'app_store_search',
        description: 'Search for applications in the app store',
        parameters: { query: 'string' },
      },
      {
        name: 'app_store_install',
        description: 'Install an application from the app store',
        parameters: { app_name: 'string' },
      },
      {
        name: 'app_store_uninstall',
        description: 'Uninstall an application',
        parameters: { app_name: 'string' },
      },
      {
        name: 'app_store_launch',
        description: 'Launch an installed application',
        parameters: { app_name: 'string' },
      },
      {
        name: 'app_store_list_installed',
        description: 'List all installed applications',
        parameters: {},
      },
    ]

    this.send({
      type: 'register_tools',
      tools,
    })
  }

  private async handleMessage(message: ClawdbotMessage) {
    if (message.type === 'tool_call' && message.tool) {
      const handler = this.handlers.get(message.tool)
      if (handler) {
        try {
          const result = await handler(message.parameters || {})
          this.send({
            type: 'tool_result',
            tool: message.tool,
            result,
          })
        } catch (error) {
          this.send({
            type: 'tool_error',
            tool: message.tool,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }
  }

  private send(message: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
    this.ws?.close()
  }
}
