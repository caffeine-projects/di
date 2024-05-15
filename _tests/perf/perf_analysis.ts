import 'reflect-metadata'

import { DI } from '../../DI.js'
import { Inject } from '../../decorators/Inject.js'
import { Injectable } from '../../decorators/Injectable.js'
import { Transient } from '../../decorators/Transient.js'

const tkMsg = Symbol('msg')

interface Message {
  act(): string
}

@Injectable(tkMsg)
@Transient()
class HiMessage implements Message {
  act(): string {
    return 'hi'
  }
}

@Injectable()
class ByMessage implements Message {
  act(): string {
    return 'bye'
  }
}

@Injectable()
class Messenger {
  constructor(@Inject(tkMsg) readonly message: Message) {}

  act(): string {
    return this.message.act()
  }
}

const di = DI.setup()

for (let i = 0; i < 100000000; i++) {
  const msg = di.get(Messenger)
  msg.act()
}
