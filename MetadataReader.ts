import { Key } from './Key'
import { Binding } from './Binding.js'

export interface MetadataReader {
  read(key: Key): Partial<Binding>
}
