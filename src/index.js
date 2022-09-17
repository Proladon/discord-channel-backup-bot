// Require the necessary discord.js classes
import { Client, GatewayIntentBits } from 'discord.js'
import { config } from 'dotenv'
import { useSlashCommand, registerClientCommand } from '@/use/command'
import { useCommandHandler } from '@/use/commandHandler'
import { useEventHandler } from '@/use/eventHandler'

config()

if (!process.env.BOT_TOKEN) {
  console.log('Missing bot token to run bot !')
  process.exit(1)
}

// Create a bot client instance
const client = new Client({
  // give discord intents as you need
  intents: [
    GatewayIntentBits.Guilds
  ]
})


// register command to current client instance
await registerClientCommand(client)
const init = [
  useCommandHandler(client),
  useEventHandler(client),
  useSlashCommand(client),
]
await Promise.all(init)

try {
  client.login(process.env.BOT_TOKEN)
} catch (error) {
  console.log(error)
}
