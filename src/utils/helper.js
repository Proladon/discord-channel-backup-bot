export const wait = (delay = 0) =>
  new Promise((resolve) => setTimeout(resolve, delay))
