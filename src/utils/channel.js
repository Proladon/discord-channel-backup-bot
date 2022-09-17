import { GetChannelMessages } from '@/api/channel'

export const findChannel = async (guild, channelId) => {
  try {
    return await guild.channels.fetch(channelId)
  } catch (error) {
    console.log(error)
    return null
  }
}

export const editChannelPermission = async (channel, permissions) => {
  await channel.edit({ permissionOverwrites: permissions })
}

export const getChannelAllMessages = async (channel) => {
  const [res, err] = await GetChannelMessages({
    channel_id: channel.id,
  })
  if (err) return
  console.log(res)
}
