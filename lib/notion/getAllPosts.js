import BLOG from '@/blog.config'
import { NotionAPI } from 'notion-client'
import { idToUuid } from 'notion-utils'
import dayjs from '@/lib/day'
import getAllPageIds from './getAllPageIds'
import getPageProperties from './getPageProperties'
import filterPublishedPosts from './filterPublishedPosts'
import { retryWithBackoff } from './retryWithBackoff'
import {
  normalizeCollection,
  normalizeSchema,
  normalizePageBlock
} from './normalizeNotionData'
import { getAllMarkdownPosts } from '@/lib/markdown/getAllMarkdownPosts'
import { parseNotionPageId } from './parsePageId'

function unwrapBlock(item) {
  let current = item
  for (let i = 0; i < 4; i++) {
    if (!current) return null
    if (current.type) return current
    current = current.value
  }
  return null
}

function getCollectionPagesFromBlocks(block) {
  const ids = []
  for (const [pid, item] of Object.entries(block || {})) {
    const value = unwrapBlock(item)
    if (!value) continue
    if (value.type === 'page' && value.parent_table === 'collection') {
      ids.push(pid)
    }
  }
  return ids
}

function getSchemaFromRecordMap(response) {
  const collections = Object.values(response.collection || {})
  for (const raw of collections) {
    const collection = normalizeCollection(raw)
    if (collection?.schema && Object.keys(collection.schema).length) {
      return normalizeSchema(collection.schema)
    }
  }
  return {}
}

/**
 * @param {{ onlyNewsletter: boolean }} - false: all types / true: newsletter only
 * @param {{ onlyPost: boolean }} - false: all types / true: post only
 * @param {{ onlyHidden: boolean }} - false: all types / true: hidden only
 */
export async function getAllPosts({
  onlyNewsletter = false,
  onlyPost = false,
  onlyHidden = false
}) {
  const markdownRaw = getAllMarkdownPosts()
  const markdownPosts = filterPublishedPosts({
    posts: markdownRaw,
    onlyNewsletter,
    onlyPost,
    onlyHidden
  })

  let notionPosts = []
  const id = parseNotionPageId(BLOG.notionPageId)

  if (!id) {
    console.warn('NOTION_PAGE_ID is not set — serving Markdown posts only')
  } else {
    const authToken = process.env.NOTION_ACCESS_TOKEN || null
    const api = new NotionAPI({ authToken })

    try {
      const response = await retryWithBackoff(() => api.getPage(id))
      const uuid = idToUuid(id)
      const block = response.block || {}
      const schema = getSchemaFromRecordMap(response)
      const queryIds = getAllPageIds(response.collection_query)
      const blockIds = getCollectionPagesFromBlocks(block)
      const pageIds = [...new Set([...queryIds, ...blockIds])]

      console.log(
        `[notion] page ${uuid}: ${pageIds.length} collection pages ` +
          `(query=${queryIds.length}, blocks=${blockIds.length}), ` +
          `schema=${Object.keys(schema).length}`
      )

      const data = []
      for (const pid of pageIds) {
        try {
          const pageBlock =
            normalizePageBlock(block[pid]) ||
            normalizePageBlock(block[idToUuid(pid)])
          if (!pageBlock) {
            console.warn(`Could not resolve page block for id: ${pid}`)
            continue
          }

          const properties =
            (await getPageProperties(pid, pageBlock, schema, authToken)) || null
          if (!properties) continue

          properties.fullWidth = pageBlock?.format?.page_full_width ?? false
          properties.date = (
            properties.date?.start_date
              ? dayjs.tz(properties.date?.start_date)
              : dayjs(pageBlock?.created_time)
          ).valueOf()

          data.push(properties)
        } catch (pageError) {
          console.warn(`Skip Notion page ${pid}:`, pageError.message)
        }
      }

      notionPosts = filterPublishedPosts({
        posts: data.map((p) => ({ ...p, source: 'notion' })),
        onlyNewsletter,
        onlyPost,
        onlyHidden
      })
      console.log(
        `[notion] parsed ${data.length} pages, published filter kept ${notionPosts.length}`
      )
    } catch (error) {
      console.error('Failed to get posts from Notion:', error.message)
      if (error.response?.statusCode === 400) {
        console.error('Check: NOTION_PAGE_ID, NOTION_ACCESS_TOKEN, page type')
      }
    }
  }

  const posts = [...notionPosts, ...markdownPosts]

  if (BLOG.sortByDate) {
    posts.sort((a, b) => b.date - a.date)
  }

  return posts
}
