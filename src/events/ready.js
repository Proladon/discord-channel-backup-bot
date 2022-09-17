export default {
  name: 'ready',
  once: true,
  execute(bot) {
    const botName = bot.user.username
    const discriminator = bot.user.discriminator
    console.log(`> Bot ${botName}#${discriminator} is now ready ! <`)
  },
}
