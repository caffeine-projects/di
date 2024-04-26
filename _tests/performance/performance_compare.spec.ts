import { performance } from 'perf_hooks'
import { expect } from '@jest/globals'
import { yellow, blue, green } from 'colorette'
import { gray } from 'colorette'
import { Root } from './_fixtures/di.js'
import { di } from './_fixtures/di.js'
import { RootSingleton } from './_fixtures/di.js'
import { InvRootSingleton as InvSingletonRoot, inv } from './_fixtures/inversify.js'
import { InvRoot } from './_fixtures/inversify.js'
import { TsySingletonRoot, tsy } from './_fixtures/tsy.js'
import { TsyRoot } from './_fixtures/tsy.js'
import { bootstrap } from './_fixtures/nest.js'
import { NestRoot } from './_fixtures/nest.js'
import { loopCtx } from './_fixtures/loopback.js'
import { LoopRoot } from './_fixtures/loopback.js'

const failIfLess = process.env.TEST_FAIL_PERF === 'true'

const diff = (a: number, b: number) => '~' + String(Math.round(((a - b) / b) * 100)) + '%'

describe('Performance Compare', function () {
  interface Results {
    avg: number
    max: number
    min: number
    items: Array<{ pos: number; total: number }>
  }

  function resolve(times: number, res: () => unknown): Results {
    const result = {
      avg: -1,
      max: -1,
      min: Number.MAX_SAFE_INTEGER,
      items: [] as { pos: number; total: number }[],
    }

    let i: number

    for (i = 0; i < times; i++) {
      const start = performance.now()

      res()

      const end = performance.now()
      const total = end - start

      if (total < result.min) {
        result.min = total
      }
      if (total > result.max) {
        result.max = total
      }

      result.items.push({ pos: i, total })
    }

    result.avg = result.items.reduce((p, c) => p + c.total, 0) / result.items.length
    result.items.sort((a, b) => b.total - a.total)

    return result
  }

  async function resolveAsync(times: number, res: () => Promise<unknown>) {
    const result = {
      avg: -1,
      max: -1,
      min: Number.MAX_SAFE_INTEGER,
      items: [] as { pos: number; total: number }[],
    }

    let i: number

    for (i = 0; i < times; i++) {
      const start = performance.now()

      await res()

      const end = performance.now()
      const total = end - start

      if (total < result.min) {
        result.min = total
      }
      if (total > result.max) {
        result.max = total
      }

      result.items.push({ pos: i, total })
    }

    result.avg = result.items.reduce((p, c) => p + c.total, 0) / result.items.length
    result.items.sort((a, b) => b.total - a.total)

    return result
  }

  const times = 15000

  it(`should resolve ${times} times in less time then the others`, async () => {
    const nestApp = await bootstrap()

    expect(inv.get(InvRoot)).toBeInstanceOf(InvRoot)
    expect(inv.get(InvSingletonRoot)).toBeInstanceOf(InvSingletonRoot)
    expect(tsy.resolve(TsyRoot)).toBeInstanceOf(TsyRoot)
    expect(tsy.resolve(TsySingletonRoot)).toBeInstanceOf(TsySingletonRoot)
    expect(loopCtx.getSync(LoopRoot.name)).toBeInstanceOf(LoopRoot)
    expect(di.get(Root)).toBeInstanceOf(Root)

    const invRes = resolve(times, () => inv.get(InvRoot))
    const invSingletonRes = resolve(times, () => inv.get(InvSingletonRoot))
    const tsyRes = resolve(times, () => tsy.resolve(TsyRoot))
    const tsySingletonRes = resolve(times, () => tsy.resolve(TsySingletonRoot))
    const diRes = resolve(times, () => di.get(Root))
    const diSingletonRes = resolve(times, () => di.get(RootSingleton))
    const nestRes = resolve(times, () => nestApp.get(NestRoot))
    const loopRes = resolve(times, () => loopCtx.getSync(LoopRoot.name))

    const diAsync = await resolveAsync(times, () => di.getAsync(RootSingleton))

    console.log('DI Avg: ' + gray(String(diRes.avg)))
    console.log('DI Singleton Avg: ' + gray(String(diSingletonRes.avg)))
    console.log('DI Async Avg: ' + gray(String(diAsync.avg)))

    function check(name: string, di: Results, compareTo: Results) {
      const msg = `${name}: diff: ${diff(di.avg, compareTo.avg)}`

      console.log(`${name}: avg: ${gray(String(compareTo.avg))}`)

      if (di.avg > compareTo.avg) {
        console.log(yellow(msg))
      } else {
        console.log(green(msg))
      }
    }

    check('inversify', diRes, invRes)
    check('inversify singleton', diSingletonRes, invSingletonRes)
    check('tsyringe', diRes, tsyRes)
    check('tsyringe singleton', diSingletonRes, tsySingletonRes)
    check('loopback', diRes, loopRes)
    check('nestjs', diSingletonRes, nestRes)

    if (failIfLess) {
      expect(diRes.avg).toBeLessThan(invRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(invSingletonRes.avg)
      expect(diRes.avg).toBeLessThan(tsyRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(tsySingletonRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(nestRes.avg)
    }
  })
})
