import { ensureFile, writeJson } from 'fs-extra'

export const saveTempFile = async (data, serialNum) => {
  try {
    const filePath = `./temp/temp.${serialNum}.json`
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
