import { Binding } from '../Binding.js'
import { TokenDescriptor } from '../Token.js'
import { MetadataReader } from '../MetadataReader.js'
import { Symbols } from '../Symbols.js'

export class BuiltInMetadataReader implements MetadataReader {
  read(token: any): Partial<Binding> {
    if (typeof token === 'function') {
      const symbols = Object.getOwnPropertySymbols(token)
      const kDeps = symbols.find(x => x === Symbols.injections)

      if (kDeps) {
        const deps = token[kDeps]
        const injections = new Array<TokenDescriptor>(deps.length)

        for (let i = 0; i < deps.length; i++) {
          const d = deps[i]
          if (typeof d === 'object') {
            injections[i] = d
          } else {
            injections[i] = { token: d }
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
