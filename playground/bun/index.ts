import { parseArgs } from 'args-tokens/parser'

console.log('tokens:', parseArgs(Bun.argv.slice(2)))
