import axios from 'axios'

export const discord = axios.create({
  baseURL: `https://discord.com/api/v${process.env.DISCORD_API_VERSION}`,
})

// Handler
const handleSuccessRes = (response) => {
  return [response.data, null]
}
const handleErrorRes = (error) => {
  return [null, error.response || error]
}

// Res
discord.interceptors.response.use(handleSuccessRes, handleErrorRes)
// Req
discord.interceptors.request.use(async (config) => {
  config.headers.Authorization = `Bot ${process.env.BOT_TOKEN}`
  return config
})
