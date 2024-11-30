// reflect-metadata is necessary for the legacy third party implementations
import 'reflect-metadata'

import { performance } from 'node:perf_hooks'
import { describe, it } from 'node:test'
import { expect } from 'expect'
import { green, yellow } from 'colorette'
import { gray } from 'colorette'
import { Root } from './_testdata/di.js'
import { di } from './_testdata/di.js'
import { RootSingleton } from './_testdata/di.js'
import { inv, InvRootSingleton as InvSingletonRoot } from './_testdata/third_party_legacy/dist/inversify.js'
import { InvRoot } from './_testdata/third_party_legacy/dist/inversify.js'
import { tsy, TsySingletonRoot } from './_testdata/third_party_legacy/dist/tsy.js'
import { TsyRoot } from './_testdata/third_party_legacy/dist/tsy.js'
import { bootstrap, NestTransientRoot } from './_testdata/third_party_legacy/dist/nest.js'
import { NestRoot } from './_testdata/third_party_legacy/dist/nest.js'
import { loopCtx, LoopSingletonRoot } from './_testdata/third_party_legacy/dist/loopback.js'
import { LoopRoot } from './_testdata/third_party_legacy/dist/loopback.js'

const failIfLess = process.env.TEST_FAIL_PERF === 'true'
const iterations = 15000
const items = new Array<{ pos: number; total: number }>(iterations)
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
      items: items,
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

      result.items[i] = { pos: i, total }
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
      items: items,
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

      result.items[i] = { pos: i, total }
    }

    result.avg = result.items.reduce((p, c) => p + c.total, 0) / result.items.length
    result.items.sort((a, b) => b.total - a.total)

    return result
  }

  it(`should resolve ${iterations} times in less time then the others`, async () => {
    const nestApp = await bootstrap()

    expect(inv.get(InvRoot)).toBeInstanceOf(InvRoot)
    expect(inv.get(InvSingletonRoot)).toBeInstanceOf(InvSingletonRoot)
    expect(tsy.resolve(TsyRoot)).toBeInstanceOf(TsyRoot)
    expect(tsy.resolve(TsySingletonRoot)).toBeInstanceOf(TsySingletonRoot)
    expect(loopCtx.getSync(LoopRoot.name)).toBeInstanceOf(LoopRoot)
    expect(di.get(Root)).toBeInstanceOf(Root)

    const invRes = resolve(iterations, () => inv.get(InvRoot))
    const invSingletonRes = resolve(iterations, () => inv.get(InvSingletonRoot))
    const tsyRes = resolve(iterations, () => tsy.resolve(TsyRoot))
    const tsySingletonRes = resolve(iterations, () => tsy.resolve(TsySingletonRoot))
    const diRes = resolve(iterations, () => di.get(Root))
    const diSingletonRes = resolve(iterations, () => di.get(RootSingleton))
    const nestSingletonRes = resolve(iterations, () => nestApp.get(NestRoot))
    const nestRes = resolve(iterations, () => nestApp.resolve(NestTransientRoot))
    const loopRes = resolve(iterations, () => loopCtx.getSync(LoopRoot.name))
    const loopSingletonRes = resolve(iterations, () => loopCtx.getSync(LoopSingletonRoot.name))

    const diAsync = await resolveAsync(iterations, () => di.getAsync(RootSingleton))

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
    check('loopback singleton', diSingletonRes, loopSingletonRes)
    check('nestjs', diRes, nestRes)
    check('nestjs singleton', diSingletonRes, nestSingletonRes)

    if (failIfLess) {
      expect(diRes.avg).toBeLessThan(invRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(invSingletonRes.avg)

      expect(diRes.avg).toBeLessThan(loopRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(loopSingletonRes.avg)

      expect(diRes.avg).toBeLessThan(tsyRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(tsySingletonRes.avg)

      expect(diRes.avg).toBeLessThan(nestRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(nestSingletonRes.avg)
    }
  })
})
