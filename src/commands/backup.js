import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import { GetChannelMessages } from '@/api/channel'
import { saveTempFile } from '@/utils/temp'

export const data = new SlashCommandBuilder()
  .setName('backup')
  .setDescription('備份指定頻道的所有訊息至另外一個伺服器頻道')
  .setDefaultMemberPermissions(0)
  .addChannelOption((option) =>
    option.setName('備份頻道').setDescription('要備份的頻道').setRequired(true)
  )
  .addChannelOption((option) =>
    option.setName('目的頻道').setDescription('備份目的頻道').setRequired(true)
  )

export const execute = async (ctx) => {
  await ctx.deferReply()
  const targetChannel = ctx.options.getChannel('備份頻道')
  const dstChannel = ctx.options.getChannel('目的頻道')

  let data = []
  let count = 1
  let start = true
  while (start || data.length === 2) {
    start = false
    const params = {
      channel_id: targetChannel.id,
      limit: 2,
    }
    if (data.length === 2) params.before = data[1].id
    const [res, err] = await GetChannelMessages(params)
    console.log(res.length)
    data = res
    if (err) await ctx.editReply('發生錯誤')
    await saveTempFile(data, count)
    count++
  }

  // const replyEmbed = new EmbedBuilder().setTitle(`test`).setDescription('test')
  // await ctx.editReply({ embeds: [replyEmbed] })
  await ctx.editReply(`ok `)
}
