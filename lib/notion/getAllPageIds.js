import { idToUuid } from 'notion-utils'

function collectBlockIds(view, pageSet) {
  view?.collection_group_results?.blockIds?.forEach((id) => pageSet.add(id))
  view?.blockIds?.forEach((id) => pageSet.add(id))
  view?.collection_group_results?.groups?.forEach((group) => {
    group?.blockIds?.forEach((id) => pageSet.add(id))
  })
}

export default function getAllPageIds(collectionQuery, viewId) {
  if (!collectionQuery) return []
  const views = Object.values(collectionQuery)[0]
  if (!views) return []

  if (viewId) {
    const vId = idToUuid(viewId)
    return views[vId]?.blockIds || views[vId]?.collection_group_results?.blockIds || []
  }

  const pageSet = new Set()
  collectBlockIds(views, pageSet)
  Object.values(views).forEach((view) => collectBlockIds(view, pageSet))
  return [...pageSet]
}
