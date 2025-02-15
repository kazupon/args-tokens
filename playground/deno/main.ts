import { parseArgs } from 'jsr:@kazupon/args-tokens/parser'

console.log('tokens:', parseArgs(Deno.args))
