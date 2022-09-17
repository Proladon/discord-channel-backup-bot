import { ensureFile, writeJson } from 'fs-extra'

export const saveTempFile = async (data, serialNum) => {
  try {
    const filePath = `./temp/temp-${serialNum}.json`
    await ensureFile(filePath)
    await writeJson(filePath, { messages: data })
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
