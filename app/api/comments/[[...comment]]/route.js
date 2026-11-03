import { NextComment } from '@fuma-comment/server/next'
import { auth, storage } from '@/lib/comment-config'
import { hasDatabase, ensureDbTables } from '@/lib/db'

export const dynamic = 'force-dynamic'

const unavailable = () =>
  Response.json(
    { error: 'Comment system is not configured.' },
    { status: 503 }
  )

const handlers =
  hasDatabase && auth && storage ? NextComment({ auth, storage }) : null

async function withParams(handler, req, ctx) {
  if (!handler) return unavailable()
  await ensureDbTables()
  const params = await ctx.params
  const normalized = { comment: params?.comment ?? [] }
  return handler(req, { ...ctx, params: Promise.resolve(normalized) })
}

export const GET = (req, ctx) => withParams(handlers?.GET, req, ctx)
export const POST = (req, ctx) => withParams(handlers?.POST, req, ctx)
export const PATCH = (req, ctx) => withParams(handlers?.PATCH, req, ctx)
export const DELETE = (req, ctx) => withParams(handlers?.DELETE, req, ctx)
