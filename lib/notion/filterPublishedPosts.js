function asList(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => item != null && item !== '')
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function pickType(post) {
  const candidates = [post.type, post.Type, post.類型, post.类型]
  for (const value of candidates) {
    const list = asList(value)
    if (list.length) return list
  }
  return []
}

function pickStatus(post) {
  const candidates = [post.status, post.Status, post.狀態, post.状态]
  for (const value of candidates) {
    const list = asList(value)
    if (list.length) return list
  }
  return []
}

function pickTitle(post) {
  return post.title || post.Title || post.標題 || post.标题 || ''
}

function pickSlug(post) {
  return post.slug || post.Slug || post.別名 || post.别名 || ''
}

export default function filterPublishedPosts({
  posts,
  onlyNewsletter,
  onlyPost,
  onlyHidden
}) {
  if (!posts || !posts.length) return []
  return posts
    .map((post) => {
      const type = pickType(post)
      const status = pickStatus(post)
      return {
        ...post,
        title: pickTitle(post),
        slug: pickSlug(post),
        type,
        status
      }
    })
    .filter((post) => {
      const type = post.type[0]
      if (onlyNewsletter) return type === 'Newsletter'
      if (onlyPost) return type === 'Post'
      if (onlyHidden) return type === 'Hidden'
      return type !== 'Hidden'
    })
    .filter((post) => {
      return (
        post.title &&
        post.slug &&
        post.status[0] === 'Published' &&
        post.date <= Date.now()
      )
    })
}
