import { EmbedBuilder } from 'discord.js'
import { GetChannelMessages, FindChannelMessage } from '@/api/channel'
import {
  readJson,
  remove,
  ensureFile,
  writeJson,
  createWriteStream,
  ensureDir,
} from 'fs-extra'
import config from '@/config'
import { wait, sortByDate } from '@/utils/helper'
import fg from 'fast-glob'
import axios from 'axios'

export default class Backup {
  constructor() {
    this.state = {
      ctx: null,
      last: { author: { id: '' } },
      totalMessagesCount: 0,
      rootCtx: null,
      targetChannel: null,
      dstChannel: null,
      ctxChaneel: null,
      userDMChannel: null,
    }
  }

  resetState() {
    this.state = {
      last: { author: { id: '' } },
      totalMessagesCount: 0,
      rootCtx: null,

      targetChannel: null,
      dstChannel: null,
      ctxChaneel: null,
      userDMChannel: null,
      dmCtx: null,
    }
  }

  async backup({ targetChannel, dstChannel }) {
    // STEP.1 fetch all messages and save to temp link files
    console.log('step.1')
    await this.saveHistoryMessagesLinkTempFiles({
      targetChannel,
      fetchEachLimit: 100,
    })

    // STEP.2 loop all message temp files
    console.log('step.2')
    const tempFilesList = await this.getMessageTempFilesList(targetChannel)
    console.log('tempFilesList', tempFilesList.length)
    for (const filePath of tempFilesList) {
      const tempFile = await readJson(filePath)
      // STEP.3 loop all message in temp file
      console.log('step.3')
      await this.loopEachMessage(tempFile, targetChannel, dstChannel)
      await remove(filePath)
    }
  }

  async getMessageTempFilesList(targetChannel) {
    const tempFiles = await fg(`./temp/channel/${targetChannel.id}/*.json`)
    // const tempFilesCount = tempFiles.length
    const sortedTempFilesList = this.sortTempFilesName(tempFiles)
    return sortedTempFilesList
  }

  async saveHistoryMessagesLinkTempFiles({ targetChannel, fetchEachLimit }) {
    if (!fetchEachLimit) fetchEachLimit = 100
    let data = []
    let count = 1
    let start = true
    while (start || data.length === fetchEachLimit) {
      start = false
      const params = {
        channel_id: targetChannel.id,
        fetchEachLimit,
      }
      if (data.length === fetchEachLimit)
        params.before = data[fetchEachLimit - 1].id
      const [res, err] = await GetChannelMessages(params)
      data = res.map((msg) => ({ id: msg.id, date: msg.timestamp }))

      if (err) return await this.state.ctx.editReply('發生錯誤')
      if (!data.length) break

      await this.saveMessagesToTemp({
        channel: targetChannel,
        data: sortByDate(data),
        serialNum: count,
      })

      count++
      await wait(config.Interval.fetchChannelHistoryMsg)
    }
  }

  async loopEachMessage(tempFile, targetChannel, dstChannel) {
    for (const msgLink of tempFile.messages) {
      const [msg, err] = await FindChannelMessage({
        channel_id: targetChannel.id,
        message_id: msgLink.id,
      })
      if (err) {
        console.log(err)
        await this.state.ctx.editReply('發生錯誤')
        return false
      }

      await this.saveMessageFilesToTemp(msg)

      // Send msg to target channel
      await wait(config.Interval.sendMsg)
      //   --- if thread ---
      if (msg.type === 18 && msg.thread) {
        await this.handleThread({
          msg,
          dstChannel,
        })
      }
      //   --- if normal message ---
      if (msg.type === 0) {
        await this.handleNormalMessage(msg, dstChannel)
      }
    }
  }

  async handleThread({ msg, dstChannel }) {
    this.state.last = { author: { id: '' } }
    const client = this.state.ctx.client
    const thread = await dstChannel.threads.create({
      name: msg.thread.name,
    })

    const targetThreadChannel = await client.channels.fetch(msg.thread.id)
    const dstThreadChannel = await client.channels.fetch(thread.id)

    await this.backup({
      targetChannel: targetThreadChannel,
      dstChannel: dstThreadChannel,
    })
  }

  async handleNormalMessage(msg, dstChannel) {
    const msgPayload = {
      files: await fg(`./temp/files/${msg.id}/*`),
    }
    if (this.state.last.author.id !== msg.author.id) {
      await dstChannel.send({ embeds: [await this.showAuthor(msg)] })
      this.state.last = msg
    }

    if (!msg.content && !msg.attachments.length && !msg.embeds.length) return
    if (msg.content) msgPayload.content = msg.content
    if (msg.embeds.length) msgPayload.embeds = msg.embeds
    await dstChannel.send(msgPayload)
    await remove(`./temp/files/${msg.id}`)
  }

  async showAuthor(msg) {
    return new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`${msg.author.username}#${msg.author.discriminator}`)
      .setTimestamp(new Date(msg.timestamp))
      .setThumbnail(
        `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
      )
  }

  async saveMessagesToTemp({ channel, data, serialNum }) {
    try {
      await ensureDir(`./temp/channel/${channel.id}`)
      const filePath = `./temp/channel/${channel.id}/temp.${serialNum}.json`
      await ensureFile(filePath)
      await writeJson(filePath, { messages: data })
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  sortTempFilesName(tempFilesArray) {
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

  async saveMessageFilesToTemp(msg) {
    if (msg.attachments.length) {
      for (const attachment of msg.attachments) {
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
  }
}
