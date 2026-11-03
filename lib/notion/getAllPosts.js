import BLOG from '@/blog.config'
import { NotionAPI } from 'notion-client'
import { idToUuid } from 'notion-utils'
import dayjs from '@/lib/day'
import getAllPageIds from './getAllPageIds'
import getPageProperties from './getPageProperties'
import filterPublishedPosts from './filterPublishedPosts'
import { retryWithBackoff } from './retryWithBackoff'
import {
  normalizeNotionMetadata,
  normalizeCollection,
  normalizeSchema,
  normalizePageBlock
} from './normalizeNotionData'
import { getAllMarkdownPosts } from '@/lib/markdown/getAllMarkdownPosts'
import { parseNotionPageId } from './parsePageId'

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
  // Always load and filter Markdown posts — they work without Notion
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
      const collectionQuery = response.collection_query

      let rawMetadata = normalizeNotionMetadata(block, uuid)
      if (!rawMetadata) {
        const collectionView = Object.values(block).find((item) => {
          const value = item?.value?.type ? item.value : item?.value?.value || item
          return (
            value?.type === 'collection_view_page' ||
            value?.type === 'collection_view'
          )
        })
        rawMetadata = normalizeNotionMetadata(
          { [uuid]: collectionView },
          uuid
        ) || (collectionView?.value?.type ? collectionView.value : collectionView?.value?.value)
      }

      const collectionId = rawMetadata?.collection_id
      const rawCollection =
        (collectionId &&
          (response.collection?.[collectionId] ||
            response.collection?.[idToUuid(collectionId)])) ||
        Object.values(response.collection || {})[0] ||
        {}
      const collection = normalizeCollection(rawCollection)
      const schema = normalizeSchema(collection?.schema || {})

      if (
        rawMetadata?.type !== 'collection_view_page' &&
        rawMetadata?.type !== 'collection_view'
      ) {
        console.log(`pageId '${uuid}' is not a database`)
      } else {
        const pageIds = getAllPageIds(collectionQuery)
        console.log(
          `[notion] database ${uuid}: ${pageIds.length} pages, schema keys: ${Object.keys(schema).length}`
        )
        const data = []
        for (let i = 0; i < pageIds.length; i++) {
          const pid = pageIds[i]
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
      }
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
