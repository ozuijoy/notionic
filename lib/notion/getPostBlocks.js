import BLOG from '@/blog.config'
import { NotionAPI } from 'notion-client'
import { getPreviewImageMap } from './previewImages'
import { retryWithBackoff } from './retryWithBackoff'

export async function getPostBlocks(id) {
  const authToken = process.env.NOTION_ACCESS_TOKEN || null
  const api = new NotionAPI({ authToken })

  try {
    const pageBlock = await retryWithBackoff(() => api.getPage(id))
    if (BLOG.previewImagesEnabled) {
      try {
        pageBlock.preview_images = await getPreviewImageMap(pageBlock)
      } catch (previewError) {
        console.warn(`Preview images failed for ${id}:`, previewError.message)
      }
    }
    return pageBlock
  } catch (error) {
    console.error(`Failed to get page blocks for ${id}:`, error.message)
    if (error.response?.statusCode === 400) {
      console.error('This might be due to missing environment variables or incorrect Notion page ID')
    }
    throw error
  }
}
