import { Key } from './Key'
import { Binding } from './Binding.js'

export interface FilterContext {
  key: Key
  binding: Binding
}

export type Filter = (ctx: FilterContext) => boolean
