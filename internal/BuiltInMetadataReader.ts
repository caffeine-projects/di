import { Binding } from '../Binding.js'
import { KeyWithOptions } from '../Key'
import { MetadataReader } from '../MetadataReader.js'
import { Symbols } from '../Symbols.js'

export class BuiltInMetadataReader implements MetadataReader {
  read(key: any): Partial<Binding> {
    if (typeof key === 'function') {
      const symbols = Object.getOwnPropertySymbols(key)
      const kDeps = symbols.find(x => x === Symbols.injections)

      if (kDeps) {
        const deps = key[kDeps]
        const injections = new Array<KeyWithOptions>(deps.length)

        for (let i = 0; i < deps.length; i++) {
          const d = deps[i]
          if (typeof d === 'object') {
            injections[i] = d
          } else {
            injections[i] = { key: d }
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
