import { Parser } from 'm3u8-parser'

export function parse(playlist: string): string {
  const parser = new Parser()
  parser.push(playlist)
  parser.end()

  return parser.manifest
}
