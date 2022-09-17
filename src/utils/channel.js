import { GetChannelMessages, FindChannelMessage } from '@/api/channel'

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

export const findChannelMessages = async (channel, message_id) => {
  const [res, err] = await FindChannelMessage({
    channel_id: channel.id,
    message_id,
  })
  if (err) return
  console.log(res)
}
