import { parseArgs } from 'args-tokens'

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
console.log('tokens:', parseArgs(Bun.argv.slice(2)))
