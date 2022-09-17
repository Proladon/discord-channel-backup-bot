import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import { GetChannelMessages, FindChannelMessage } from '@/api/channel'
import { saveTempFile } from '@/utils/temp'
import { wait } from '@/utils/helper'
import fg from 'fast-glob'
import { copyFileSync, readJson } from 'fs-extra'

const sortDateData = (data) => {
  const cloneData = [...data]
  return cloneData.sort((a, b) => {
    const aDate = new Date(a.date)
    const bDate = new Date(b.date)
    return +aDate - bDate
  })
}

const sortTempFiles = (tempFilesArray) => {
  const list = [...tempFilesArray]
  list.sort((a, b) => {
    const alist = a.split('.')
    const blist = b.split('.')
    const aFileNum = Number(alist[alist.length - 2])
    const bFileNum = Number(blist[blist.length - 2])
    return bFileNum - aFileNum
  })
  return list
}

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

  const dm = await ctx.member.createDM()
  const dmMsg = await dm.send(`Exporting: ${targetChannel.name}`)
  console.log('get all messages ...')

  // =================================== //
  // get all channel messages and save temp files //
  // =================================== //

  let data = []
  let count = 1
  let start = true
  const limit = 3
  while (start || data.length === limit) {
    start = false
    const params = {
      channel_id: targetChannel.id,
      limit,
    }
    if (data.length === limit) params.before = data[limit - 1].id
    const [res, err] = await GetChannelMessages(params)
    data = res.map((msg) => ({ id: msg.id, date: msg.timestamp }))

    if (err) return await ctx.editReply('發生錯誤')
    if (!data.length) break

    await saveTempFile(sortDateData(data), count)
    await dmMsg.edit(`
    Exporting: ${targetChannel.name}\n
    Proccess: ${count}
    `)
    count++
    await wait(1000)
  }

  await dmMsg.edit(`
    Exporting: ${targetChannel.name}\n
    Proccess: Done!
    `)

  console.log('save temp files done.')

  // =================================== //
  // load all temp files and fetch all each message //
  // =================================== //

  const tempFiles = await fg(`./temp/*.json`)
  const tempFilesCount = tempFiles.length
  const sortedTempFilesList = sortTempFiles(tempFiles)

  console.log('load temp files ...')

  for (const filePath of sortedTempFilesList) {
    const temp = await readJson(filePath)
    for (const msg of temp.messages) {
      const [res, err] = await FindChannelMessage({
        channel_id: targetChannel.id,
        message_id: msg.id,
      })
      if (err) {
        console.log(err)
        await ctx.editReply('發生錯誤')
        return
      }
      await wait(2000)
      console.log(res)
    }
  }

  await ctx.editReply(`done`)
}
