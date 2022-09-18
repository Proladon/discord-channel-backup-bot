import { ensureFile, writeJson, createWriteStream, ensureDir } from 'fs-extra'
import { wait } from '@/utils/helper'
import axios from 'axios'

export const saveMessagesToTemp = async (channel, data, serialNum) => {
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

export const sortTempFilesName = (tempFilesArray) => {
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

export const saveMessageFilesToTemp = async (msg) => {
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
