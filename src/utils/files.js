import fg from 'fast-glob'

export const getAllCommandFiles = async () => {
  pathPattern = `@/command/**/*.js`
  return await fg(patterns, options)
}

export const getAllEventFiles = async () => {
  pathPattern = `@/event/**/*.js`
  return await fg(patterns, options)
}