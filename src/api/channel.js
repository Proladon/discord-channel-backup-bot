import { discord } from '@/api/instance'

export const GetChannelMessages = async ({
  channel_id,
  before,
  after,
  around,
  limit,
}) => {
  return await discord({
    method: 'GET',
    url: `/channels/${channel_id}/messages`,
    params: {
      channel_id,
      before,
      after,
      around,
      limit,
    },
  })
}

export const FindChannelMessage = async ({ channel_id, message_id }) => {
  return await discord({
    method: 'GET',
    url: `/channels/${channel_id}/messages/${message_id}`,
  })
}

export const FindChannelById = async (channel_id) => {
  return await discord({
    method: 'GET',
    url: `/channels/${channel_id}`,
  })
}
