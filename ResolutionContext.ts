import { Key } from './Key'
import { Binding } from './Binding.js'
import { Container } from './Container.js'

export interface ResolutionContext<A = unknown> {
  container: Container
  key: Key
  binding: Binding
  args?: A
}
