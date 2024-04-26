import { Binding } from '../Binding.js'
import { TokenSpec } from '../Token.js'
import { MetadataReader } from '../MetadataReader.js'
import { DISymbols } from '../DISymbols.js'

export class BuiltInMetadataReader implements MetadataReader {
  read(token: any): Partial<Binding> {
    if (typeof token === 'function') {
      const symbols = Object.getOwnPropertySymbols(token)
      const kDeps = symbols.find(x => x === DISymbols.kDeps)

      if (kDeps) {
        const deps = token[kDeps]
        const injections = new Array<TokenSpec>(deps.length)

        for (let i = 0; i < deps.length; i++) {
          const d = deps[i]
          if (typeof d === 'object') {
            injections[i]= d
          } else {
            injections[i] = { token: d, tokenType: d }
          }
        }

        if (injections) {
          return { injections }
        }
      }
    }

    return {}
  }
}
