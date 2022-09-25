import { SlashCommandBuilder } from 'discord.js'
import { remove } from 'fs-extra'
import Backup from '@/Service'

const Service = new Backup()
const state = Service.state

// ANCHOR Slash Command
export const data = new SlashCommandBuilder()
  .setName('backup')
  .setDescription('備份指定頻道的所有訊息至另外一個伺服器頻道')
  .setDefaultMemberPermissions(0)
  .addChannelOption((option) =>
    option.setName('備份頻道').setDescription('要備份的頻道').setRequired(true)
  )
  .addStringOption((option) =>
    option.setName('目的頻道').setDescription('備份目的頻道').setRequired(true)
  )

export const execute = async (ctx) => {
  await ctx.deferReply({ ephemeral: true })

  state.ctx = ctx

  // STEP.1 init channels
  const targetChannel = ctx.options.getChannel('備份頻道')
  const dstChannelId = ctx.options.getString('目的頻道')
  const dstChannel = await ctx.client.channels.fetch(dstChannelId)
  // const userDMChannel = await ctx.member.createDM()

  await Service.backup({ targetChannel, dstChannel })
  await remove(`./temp/channel`)
  await remove(`./temp/files`)
  await ctx.editReply(`done`)
  console.log('done.')
}
