import { createHandler } from 'nextjs-asset-manager'

const { GET, POST } = createHandler({
  include: ['src', 'public'],
  launchEditor: 'code',
})

export { GET, POST }
