import { parseArgs } from 'args-tokens'

console.log('tokens:', parseArgs(Bun.argv.slice(2)))
