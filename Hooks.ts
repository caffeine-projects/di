import { Key } from './Key'
import { Binding } from './Binding.js'

export interface Hooks {
  onSetup: { key: Key; binding: Binding }

  onBindingRegistered: { key: Key; binding: Binding }

  onBindingNotRegistered: { key: Key; binding: Binding }

  onSetupComplete: {}

  onDisposed: {}
}
