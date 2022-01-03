import { Parser } from 'm3u8-parser'

export function parsem3u8(playlist: string): string {
  const parser = new Parser()
  parser.push(playlist)
  parser.end()

  return parser.manifest
}
