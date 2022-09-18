import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import { GetChannelMessages, FindChannelMessage } from '@/api/channel'
import { saveTempFile, sortTempFilesName } from '@/utils/temp'
import { wait, sortByDate } from '@/utils/helper'
import fg from 'fast-glob'
import { readJson, remove, createWriteStream, ensureDir } from 'fs-extra'
import { findChannel } from '@/utils/channel'
import axios from 'axios'

const loopEachTempFile = async ({ filesList, fileHandler }) => {
  for (const filePath of filesList) {
    const tempFile = await readJson(filePath)
    await fileHandler(tempFile)
    // delete temp file
    await remove(filePath)
  }
}

const loopEachMessage = ({ ctx, dstChannel, targetChannel }) => {
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
      console.log(res)

      if (res.attachments.length) {
        for (const attachment of res.attachments) {
          const f = await axios({
            method: 'GET',
            url: attachment.proxy_url,
            responseType: 'stream',
          })

          await ensureDir(`./temp/files/${msg.id}`)
          f.data.pipe(
            createWriteStream(`./temp/files/${msg.id}/${attachment.filename}`)
          )
          await wait(500)
        }
      }

      await wait(2000)
      // Send msg to target channel
      const dst = await findChannel(ctx.guild, dstChannel.id)
      const msgPayload = {
        files: await fg(`./temp/files/${msg.id}/*`),
      }
      if (res.content) msgPayload.content = res.content
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
  .addChannelOption((option) =>
    option.setName('目的頻道').setDescription('備份目的頻道').setRequired(true)
  )

export const execute = async (ctx) => {
  await ctx.deferReply({ ephemeral: true })
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

    await saveTempFile(sortByDate(data), count)
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
  const sortedTempFilesList = sortTempFilesName(tempFiles)

  console.log('load temp files ...')
  await loopEachTempFile({
    filesList: sortedTempFilesList,
    fileHandler: loopEachMessage({
      ctx,
      targetChannel,
      dstChannel,
    }),
  })

  await ctx.editReply(`done`)
  console.log('done.')
}
