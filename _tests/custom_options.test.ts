import { beforeEach, describe, it } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { Provider } from '../Provider.js'
import { ResolutionContext } from '../ResolutionContext.js'
import { Injectable } from '../decorators/Injectable.js'
import { ProvidedBy } from '../decorators/ProvidedBy.js'
import { ClassProvider } from '../internal/providers/ClassProvider.js'
import { DI } from '../DI.js'
import { Options } from '../decorators/Options.js'
import { Bean } from '../decorators/Bean.js'
import { PostProcessor } from '../PostProcessor.js'
import { Configuration } from '../decorators/Configuration'

describe('Options', function () {
  describe('when providing custom options', function () {
    const spy = Spy()
    const options = { message: 'hello world' }

    beforeEach(() => {
      spy.mockReset()
    })

    class SpyProvider<T> implements Provider<T> {
      constructor(private readonly providerFn: () => Provider<T>) {}

      provide(ctx: ResolutionContext): T {
        const provider = this.providerFn()
        spy(ctx.binding.options)
        return provider.provide(ctx)
      }
    }

    @Injectable()
    @ProvidedBy(new SpyProvider(() => new ClassProvider(Dep)))
    @Options(options)
    class Dep {}

    class BeanDep {}

    class IncBeanDep {}

    @Configuration()
    class Conf {
      @Bean(BeanDep)
      @Options(options)
      beanDep() {
        return new BeanDep()
      }

      @Bean(IncBeanDep)
      @Options({ val1: 'qa' })
      @Options({ val2: 'dev' })
      inc() {
        return new IncBeanDep()
      }
    }

    @Injectable()
    @Options({ opt1: 'qa' })
    @Options({ opt2: 'dev' })
    class Inc {}

    class SpyPp implements PostProcessor {
      afterInit(instance: unknown, ctx: ResolutionContext): unknown {
        if (instance instanceof BeanDep) {
          spy(ctx.binding.options)
        }

        return instance
      }

      beforeInit(instance: unknown, ctx: ResolutionContext): unknown {
        return instance
      }
    }

    it('should be available in the binding inside resolution context', function () {
      const di = DI.setup()
      const dep = di.get(Dep)

      expect(dep).toBeInstanceOf(Dep)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(options)
    })

    it('should pass options to configuration provided components', function () {
      const pp = new SpyPp()
      const di = new DI()

      di.addPostProcessor(pp)
      di.setup()

      const dep = di.get(BeanDep)

      expect(dep).toBeInstanceOf(BeanDep)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(options)

      di.removePostProcessor(pp)
    })

    describe('applying multiple options', function () {
      it('should increment options on class level decorator', function () {
        const di = DI.setup()
        const dep = di.get(Inc)
        const binding = di.getBindings(Inc)

        expect(dep).toBeInstanceOf(Inc)
        expect(binding).toHaveLength(1)
        expect(binding[0].options).toEqual({ opt1: 'qa', opt2: 'dev' })
      })

      it('should increment options on class level decorator', function () {
        const di = DI.setup()
        const dep = di.get(IncBeanDep)
        const binding = di.getBindings(IncBeanDep)

        expect(dep).toBeInstanceOf(IncBeanDep)
        expect(binding).toHaveLength(1)
        expect(binding[0].options).toEqual({ val1: 'qa', val2: 'dev' })
      })
    })

    describe('setting options manually', function () {
      class Manual {}

      it('should set options', function () {
        const di = DI.setup()

        di.bind(Manual).toSelf().options({ test: true })

        const dep = di.get(Manual)
        const bindings = di.getBindings(Manual)

        expect(dep).toBeInstanceOf(Manual)
        expect(bindings).toHaveLength(1)
        expect(bindings[0].options).toEqual({ test: true })
      })
    })
  })
})
