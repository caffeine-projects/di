import { v4 } from 'uuid'
import { Injectable } from '../../../decorators/Injectable.js'
import { TypeOf } from '../../../TypeOf.js'
import { Bar } from './Bar.js'
import { deps } from '../../../injections/injections.js'

@Injectable([deps.defer(() => Bar)])
export class Foo {
  uuid: string = v4()

  constructor(readonly bar: TypeOf<Bar>) {}

  id = () => 'foo'

  test(): string {
    return `foo-${this.bar.id()}`
  }
}
