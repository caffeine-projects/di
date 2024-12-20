import { describe, it } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { v4 } from 'uuid'
import { Bean } from '../decorators/Bean.js'
import { Injectable } from '../decorators/Injectable.js'
import { Named } from '../decorators/Named.js'
import { Primary } from '../decorators/Primary.js'
import { DI } from '../DI'
import { TypeOf } from '../TypeOf.js'
import { Lifecycle } from '../Lifecycle.js'
import { typeRegistrar } from '../internal/TypeRegistrar.js'
import { Scoped } from '../decorators/Scoped.js'
import { Interceptor } from '../decorators/Interceptor.js'
import { ErrInvalidBinding } from '../internal/errors.js'
import { Foo } from './_testdata/circular_beans/Foo.js'
import { Bar } from './_testdata/circular_beans/Bar.js'
import { defer } from '../injections/injections.js'

import { Configuration } from '../decorators/Configuration'

describe('Configuration', function () {
  describe('class provider', function () {
    const spy = Spy()

    @Injectable()
    class Repo {
      constructor() {
        spy()
      }

      list() {
        return 'listed'
      }
    }

    @Injectable()
    class Listener {
      constructor() {
        spy()
      }

      listen() {
        return 'listened'
      }
    }

    class Service {
      constructor(
        readonly repo: Repo,
        readonly listener: Listener,
      ) {
        spy()
      }
    }

    @Configuration([Listener])
    class ManyBeans {
      constructor(private readonly listener: Listener) {
        spy()
      }

      @Bean(Service, [Repo])
      service(repo: Repo): Service {
        return new Service(repo, this.listener)
      }
    }

    it('should return instance from method based on class ref', function () {
      const service = DI.setup().get(Service)

      expect(service).toBeDefined()
      expect(service.repo.list()).toEqual('listed')
      expect(service.listener.listen()).toEqual('listened')
      expect(spy).toHaveBeenCalledTimes(4)
    })
  })

  describe('named class provider', function () {
    const spy = Spy()
    const kTest = Symbol('test')

    class Service {
      readonly id: string = v4()

      constructor(private readonly msg: string) {}

      txt() {
        return this.msg
      }
    }

    @Configuration()
    class Conf {
      @Bean(Service, ['msg'])
      @Named(kTest)
      service(msg: string) {
        spy()
        return new Service(msg)
      }
    }

    it('should resolved named beans', function () {
      const di = DI.setup()
      const msg = 'hello world'

      di.bind('msg').toValue(msg)

      const service = di.get<Service>(kTest)
      const service2 = di.get<Service>(kTest)

      expect(service).toBeInstanceOf(Service)
      expect(service.txt()).toEqual(msg)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(service).toEqual(service2)
    })
  })

  describe('value provider', function () {
    @Configuration()
    class ValueProvider {
      @Bean('txt')
      txt() {
        return 'hello world'
      }
    }

    @Injectable(['txt'])
    class UsingTxt {
      constructor(readonly txt: string) {}
    }

    it('should inject value provided by bean method', function () {
      const di = DI.setup()
      const txt = di.get('txt')
      const usingTxt = di.get(UsingTxt)
      const expected = 'hello world'

      expect(txt).toEqual(expected)
      expect(usingTxt.txt).toEqual(expected)
    })
  })

  describe('configuration class with primary beans', function () {
    const kInterface = Symbol('interface')

    abstract class Abs {
      abstract test(): string
    }

    @Injectable()
    class Abs1 extends Abs {
      test(): string {
        return 'one'
      }
    }

    interface Interface {
      test(): string
    }

    @Injectable()
    @Named(kInterface)
    class A2 implements Interface {
      test(): string {
        return 'a2'
      }
    }

    @Configuration()
    class Conf {
      @Bean(Abs)
      @Primary()
      abs(): Abs {
        return new (class extends Abs {
          test(): string {
            return 'abs-bean'
          }
        })()
      }

      @Bean(kInterface)
      @Primary()
      fromInterface(): Interface {
        return new (class implements Interface {
          test(): string {
            return 'interface-bean'
          }
        })()
      }
    }

    it('should use primary beans from configurations class', function () {
      const di = DI.setup()
      const abs = di.get(Abs)
      const i = di.get<Interface>(kInterface)

      expect(abs.test()).toEqual('abs-bean')
      expect(i.test()).toEqual('interface-bean')
    })
  })

  describe('when beans have dependencies inside same configuration context', function () {
    class Dep {
      readonly id: string = v4()
    }

    class Root {
      constructor(readonly dep: Dep) {}
    }

    @Configuration()
    class Conf {
      @Bean(Dep)
      dep() {
        return new Dep()
      }

      @Bean(Root, [Dep])
      root(dep: Dep) {
        return new Root(dep)
      }
    }

    it('should resolve components referencing another dependencies inside same configuration context', function () {
      const di = DI.setup()
      const root = di.get(Root)
      const dep = di.get(Dep)

      expect(root.dep.id).toEqual(dep.id)
    })
  })

  describe('circular references inside configuration class', function () {
    @Configuration()
    class CircularConf {
      @Bean(Foo, [defer(() => Bar)])
      foo(bar: TypeOf<Bar>) {
        return new Foo(bar)
      }

      @Bean(Bar, [defer(() => Foo)])
      @Scoped(Lifecycle.TRANSIENT)
      bar(foo: TypeOf<Foo>) {
        return new Bar(foo)
      }
    }

    it('should resolve circular dependencies', function () {
      const di = DI.setup()

      const foo = di.get(Foo)
      const bar = di.get(Bar)
      const foo2 = di.get(Foo)
      const bar2 = di.get(Bar)

      di.get(Foo)
      di.get(Bar)

      expect(foo.test()).toEqual('foo-bar')
      expect(bar.test()).toEqual('bar-foo')

      expect(foo2.test()).toEqual('foo-bar')
      expect(bar2.test()).toEqual('bar-foo')

      expect(foo.uuid).toEqual(foo2.uuid)
      expect(bar.uuid).not.toEqual(bar2.uuid)
    })
  })

  describe('when container option "overriding" is enabled', function () {
    it('should replace registered classes with beans defined in configuration classes', function () {
      expect(() => {
        @Injectable()
        class ToBeReplaced {
          id = 'injectable'
        }

        @Configuration()
        class Conf {
          @Bean(ToBeReplaced)
          override() {
            const bean = new ToBeReplaced()
            bean.id = 'replaced'
            return bean
          }
        }

        const di = DI.setup({ overriding: true })
        const replaced = di.get(ToBeReplaced)

        expect(replaced.id).toEqual('replaced')

        typeRegistrar.remove(ToBeReplaced)
        typeRegistrar.remove(Conf)
      }).not.toThrow()
    })

    it('should fail when overriding is false', function () {
      expect(() => {
        @Injectable()
        class ToBeReplaced {
          id = 'injectable'
        }

        @Configuration()
        class Conf {
          @Bean(ToBeReplaced)
          override() {
            const bean = new ToBeReplaced()
            bean.id = 'replaced'
            return bean
          }
        }

        try {
          DI.setup()
        } finally {
          typeRegistrar.remove(ToBeReplaced)
          typeRegistrar.remove(Conf)
        }
      }).toThrow()
    })
  })

  it('should fail when no key is specified', function () {
    expect(() => {
      class Comp {}

      @Configuration()
      class Conf {
        @Interceptor(instance => instance)
        comp() {
          return new Comp()
        }
      }
    }).toThrow(ErrInvalidBinding)
  })
})
