import { readFile } from 'fs/promises'

export async function readConf<T extends readonly string[]>(
  keys: T,
): Promise<{ [Property in T[number]]: string[] }> {
  type Return = { [Property in T[number]]: string[] }
  const conf = (await readFile('/root/.bitcoin/bitcoin.conf')).toString('utf8')
  const keySet = new Set(keys)
  const res = keys.reduce((r, key) => {
    return {
      ...r,
      [key]: [],
    }
  }, {} as Return)
  let section: string | null = null
  for (let line of conf.split('\n')) {
    line = line.trim()
    const sectionMatch = /^\[(main|test|signet|regtest)\]$/.exec(line)
    if (sectionMatch) {
      section = sectionMatch[1]
      continue
    }
    const match = /^([^=#]+)=(.*)$/.exec(line)
    if (match) {
      const key = section ? `${section}.${match[1]}` : match[1]
      if (keySet.has(key)) {
        res[key as T[number]] = [...res[key as T[number]], match[2]]
      }
    }
  }
  return res
}

export async function writeConf<T extends Record<string, string[]>>(
  conf: T,
): Promise<void> {
  const inConf = (await readFile('/root/.bitcoin/bitcoin.conf')).toString(
    'utf8',
  )
  let outConf = ''
  const bySection: Record<string, Record<string, string[]>> = Object.entries(
    conf,
  ).reduce((r, [key, value]) => {
    const match = /^(main|test|signet|regtest)\.(.+)$/.exec(key)
    if (match) {
      return {
        ...r,
        [match[1]]: {
          ...r[match[1]],
          [match[2]]: [...r[match[1]][match[2]], ...value],
        },
      }
    } else {
      return {
        ...r,
        '': {
          ...r[''],
          [key]: [...r[''][key], ...value],
        },
      }
    }
  }, {} as Record<string, Record<string, string[]>>)
  let section: string = ''
  for (let rawLine of inConf.split('\n')) {
    const line = rawLine.trim()
    const sectionMatch = /^\[(main|test|signet|regtest)\]$/.exec(line)
    if (sectionMatch) {
      const prev = bySection[section]
      for (let key in prev) {
        outConf += `${key}=${prev[key]}\n`
        bySection[section][key] = []
      }
      section = sectionMatch[1]
      outConf += `${rawLine}\n`
      continue
    }
    const match = /^([^=#]+)=(.*)$/.exec(line)
    if (match) {
      const key = match[1]
      if (key in bySection[section]) {
        for (let value of bySection[section][key]) {
          outConf += `${key}=${value}\n`
          bySection[section][key] = []
        }
        continue
      }
    }
    outConf += `${rawLine}\n`
    continue
  }
}
