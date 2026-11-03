export function parseNotionPageId(raw) {
  if (!raw) return ''
  const value = String(raw).trim()
  const uuid = value.match(
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i
  )
  if (uuid) return uuid[0].replace(/-/g, '')
  const compact = value.match(/[a-f0-9]{32}/i)
  if (compact) return compact[0]
  return value
}
