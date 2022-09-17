import { join } from 'path'
import fs from 'fs'
export const useEventHandler = async (client) => {
  const eventsPath = join('src/events')
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith('.js'))

  for (const file of eventFiles) {
    const filePath = join(eventsPath, file)
    let event = await import(filePath)
    event = event.default
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args))
    } else {
      client.on(event.name, (...args) => event.execute(...args))
    }
  }
}
