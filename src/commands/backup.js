import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import {
  GetChannelMessages,
  FindChannelMessage,
  FindChannelById,
} from '@/api/channel'

// utils
import {
  saveMessageFilesToTemp,
  sortTempFilesName,
  saveMessagesToTemp,
} from '@/utils/temp'
import { wait, sortByDate } from '@/utils/helper'
import { showAuthor } from '@/utils/message'
import { findChannel } from '@/utils/channel'

import fg from 'fast-glob'
import { readJson, remove } from 'fs-extra'

const loopEachTempFile = async ({ filesList, fileHandler }) => {
  for (const filePath of filesList) {
    const tempFile = await readJson(filePath)
    await fileHandler(tempFile)
    await remove(filePath) // delete temp messages files
  }
}

const loopEachMessage = ({ ctx, last, dstChannel, targetChannel }) => {
  return async (tempFile) => {
    for (const msg of tempFile.messages) {
      const [res, err] = await FindChannelMessage({
        channel_id: targetChannel.id,
        message_id: msg.id,
      })
      if (err) {
        console.log(err)
        await ctx.editReply('發生錯誤')
        return
      }

      await saveMessageFilesToTemp(res)

      await wait(2000)
      // Send msg to target channel
      // const dst = await findChannel(ctx.guild, dstChannel.id)
      const [dst] = await FindChannelById(dstChannel.id)

      const msgPayload = {
        files: await fg(`./temp/files/${msg.id}/*`),
      }
      if (last.author.id !== res.author.id) {
        await dst.send({ embeds: [showAuthor(res)] })
        last = res
      }

      if (!res.content && !res.attachments.length && !res.embeds.length)
        continue
      if (res.content) msgPayload.content = res.content
      if (res.embeds.length) msgPayload.embeds = res.embeds
      await dst.send(msgPayload)
      await remove(`./temp/files/${msg.id}`)
    }
  }
}

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
  const targetChannel = ctx.options.getChannel('備份頻道')
  // const dstChannel = ctx.options.getChannel('目的頻道')
  const dstChannelId = ctx.options.getString('目的頻道')
  const [dstChannel] = await FindChannelById(dstChannelId)

  const dm = await ctx.member.createDM()
  const dmMsg = await dm.send(`Exporting: ${targetChannel.name}`)
  console.log('get all messages ...')

  // =================================== //
  // get all channel messages and save temp files //
  // =================================== //
  let last = { author: { id: '' } }
  let data = []
  let count = 1
  let start = true
  const limit = 100
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

    await saveMessagesToTemp(targetChannel, sortByDate(data), count)
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

  const tempFiles = await fg(`./temp/channel/${targetChannel.id}/*.json`)
  const tempFilesCount = tempFiles.length
  const sortedTempFilesList = sortTempFilesName(tempFiles)

  console.log('load temp files ...')
  await loopEachTempFile({
    filesList: sortedTempFilesList,
    fileHandler: loopEachMessage({
      ctx,
      last,
      targetChannel,
      dstChannel,
    }),
  })

  await ctx.editReply(`done`)
  console.log('done.')
}
