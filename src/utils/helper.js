export const wait = (delay = 0) =>
  new Promise((resolve) => setTimeout(resolve, delay))

export const sortByDate = (data) => {
  const cloneData = [...data]
  return cloneData.sort((a, b) => {
    const aDate = new Date(a.date)
    const bDate = new Date(b.date)
    return +aDate - +bDate
  })
}
