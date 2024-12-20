import { v4 } from 'uuid'
import { describe, it } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { Named } from '../decorators/Named.js'
import { DI } from '../DI.js'
import { InjectAll } from '../decorators/InjectAll.js'
import { Provides } from '../decorators/Provides.js'
import { Scoped } from '../decorators/Scoped.js'
import { Bean } from '../decorators/Bean.js'
import { ConditionalOn } from '../decorators/ConditionalOn.js'
import { Primary } from '../decorators/Primary.js'
import { PreDestroy } from '../decorators/PreDestroy.js'
import { PostConstruct } from '../decorators/PostConstruct.js'
import { ValueProvider } from '../internal/providers/ValueProvider.js'
import { Injectable } from '../decorators/Injectable.js'
import { Lifecycle } from '../Lifecycle.js'
import { Lookup } from '../decorators/Lookup.js'
import { noop } from '../noop.js'
import { Configuration } from '../decorators/Configuration'

describe('Real World', function () {
  const initSpy = Spy()
  const destroySpy = Spy()
  const sendSpy = Spy()
  const userSpy = Spy()

  const kEmail = Symbol('mail')
  const kSms = 'sms' //Symbol('sms')
  const kAm = Symbol('am')
  const kAf = Symbol('af')
  const kAs = Symbol('as')
  const kRegions = Symbol('regions')

  const Globals = {
    Env: 'test',
  }

  class GenericRepository<T> {
    constructor(protected readonly model: () => T) {}

    name() {
      return (this.model() as any).name
    }
  }

  class User {}

  @Provides(new ValueProvider(new GenericRepository(() => Product)))
  class Product {}

  abstract class EventSender {
    abstract type: string

    abstract send(): void
  }

  @Injectable()
  class KafkaEventSender extends EventSender {
    type = 'kafka'

    send(): void {
      sendSpy()
    }
  }

  @Injectable()
  class RabbitMqEventSender extends EventSender {
    type = 'rabbitmq'

    send(): void {}
  }

  @Configuration()
  class Events {
    @Bean(EventSender)
    @ConditionalOn(() => Globals.Env !== 'test')
    rabbitEventSender(): EventSender {
      return new RabbitMqEventSender()
    }

    @Bean(EventSender)
    @ConditionalOn(() => Globals.Env === 'test')
    kafkaEventSender(): EventSender {
      return new KafkaEventSender()
    }
  }

  @Configuration()
  class RegionsConfig {
    @Bean(kAm)
    @Named(kRegions)
    am() {
      return 'am'
    }

    @Bean(kAf)
    @Named(kRegions)
    af() {
      return 'af'
    }

    @Bean(kAs)
    @Named(kRegions)
    as() {
      return 'as'
    }
  }

  interface NotificationService {
    notify(): string
  }

  @Injectable()
  @Named(kEmail)
  class EmailNotificationService implements NotificationService {
    notify(): string {
      return 'mail'
    }
  }

  @Injectable()
  @Named(kSms)
  class SmsNotificationService implements NotificationService {
    @InjectAll(kRegions)
    regions!: string[]
    message = 'sms'

    notify(): string {
      return this.message
    }

    @PostConstruct()
    init() {
      initSpy()
      this.message = this.message + ' - ' + this.regions.join(', ')
    }
  }

  abstract class UserRepository {
    abstract save(user: User): void
  }

  @Injectable([EventSender])
  class UserMongoRepository extends UserRepository {
    constructor(private readonly eventSender: EventSender) {
      super()
    }

    save(user: User): void {
      this.eventSender.send()
      userSpy()
    }

    @PreDestroy()
    dispose(): Promise<void> {
      destroySpy()
      return Promise.resolve()
    }
  }

  class ViewEngine {
    render() {
      return 'rendered'
    }
  }

  @Injectable()
  class LegacyViewEngine extends ViewEngine {
    render(): string {
      return super.render() + ' - legacy'
    }
  }

  @Injectable()
  @Primary()
  class ActualViewEngine extends ViewEngine {
    render(): string {
      return super.render() + ' - actual'
    }
  }

  @Injectable('token', [UserRepository, kSms])
  class UserService {
    constructor(
      private readonly userRepository: UserRepository,
      private readonly notificationService: NotificationService,
    ) {}

    save() {
      this.userRepository.save(new User())
    }

    send() {
      return this.notificationService.notify()
    }
  }

  @Injectable([Product])
  class ProductService {
    constructor(private readonly repository: GenericRepository<Product>) {}

    name() {
      return this.repository.name()
    }
  }

  @Scoped(Lifecycle.TRANSIENT)
  @Injectable()
  class IdGenerator {
    readonly id: string = v4()

    newId() {
      return this.id
    }
  }

  @Injectable([UserService, ProductService, ViewEngine])
  class Controller {
    constructor(
      private readonly userService: UserService,
      private readonly productService: ProductService,
      private readonly viewEngine: ViewEngine,
    ) {}

    saveUser() {
      this.userService.save()
    }

    sendMessage() {
      return this.userService.send()
    }

    productName() {
      return this.productService.name() + ' - ' + this.idGen.newId()
    }

    render() {
      return this.viewEngine.render()
    }

    @Lookup(IdGenerator)
    get idGen(): IdGenerator {
      return noop()
    }
  }

  it('should ensure everything resolves and works properly', async function () {
    const di = DI.setup()
    const controller = di.get(Controller)

    di.initInstances()

    expect(controller).toBeInstanceOf(Controller)
    expect(controller.idGen).not.toEqual(controller.idGen)
    expect(controller.render()).toEqual('rendered - actual')
    expect(controller.productName()).toContain(Product.name)
    expect(controller.productName()).not.toEqual(controller.productName())
    expect(() => controller.saveUser()).not.toThrow()
    expect(controller.sendMessage()).toContain('sms')
    expect(controller.sendMessage()).toContain('am')
    expect(controller.sendMessage()).toContain('as')
    expect(controller.sendMessage()).toContain('af')

    await di.dispose()

    expect(initSpy).toHaveBeenCalledTimes(1)
    expect(destroySpy).toHaveBeenCalledTimes(1)
    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(userSpy).toHaveBeenCalledTimes(1)
  })
})
