function collectBlockIdsDeep(node, pageSet, seen) {
  if (!node || typeof node !== 'object') return
  if (seen.has(node)) return
  seen.add(node)

  if (Array.isArray(node.blockIds)) {
    node.blockIds.forEach((id) => {
      if (id) pageSet.add(id)
    })
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectBlockIdsDeep(item, pageSet, seen))
    return
  }

  Object.values(node).forEach((value) => collectBlockIdsDeep(value, pageSet, seen))
}

export default function getAllPageIds(collectionQuery) {
  if (!collectionQuery) return []
  const pageSet = new Set()
  collectBlockIdsDeep(collectionQuery, pageSet, new Set())
  return [...pageSet]
}
