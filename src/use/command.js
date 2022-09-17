import { REST } from '@discordjs/rest'
import { Collection, Routes } from 'discord.js'
import fs from 'node:fs'
import path from 'path'

export const useSlashCommand = async () => {
  const commands = []
  const commandFiles = fs
    .readdirSync('./src/commands')
    .filter((file) => file.endsWith('.js'))

  // glob js file
  for (const file of commandFiles) {
    const command = await import(`/src/commands/${file}`)
    commands.push(command.data.toJSON())
  }

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)

    ; (async () => {
      try {
        console.log('Started refreshing application (/) commands.')

        await rest.put(
          Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
          ),
          {
            body: commands,
          }
        )

        console.log('Successfully reloaded application (/) commands.')
      } catch (error) {
        console.error(error)
      }
    })()
}

export const registerClientCommand = async (client) => {
  client.commands = new Collection()
  const commandsPath = './src/commands'
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'))

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
    const command = await import(filePath)
    client.commands.set(command.data.name, command)
  }
}
