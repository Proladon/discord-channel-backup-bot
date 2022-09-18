import { EmbedBuilder } from 'discord.js'

export const showAuthor = (msg) => {
  return new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`${msg.author.username}#${msg.author.discriminator}`)
    .setTimestamp(new Date(msg.timestamp))
    .setThumbnail(
      `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
    )
}
