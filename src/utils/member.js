export const findMember = async (guild, memberId) => {
  try {
    return await guild.members.fetch(memberId)
  } catch (error) {
    console.log(error)
    return null
  }
}