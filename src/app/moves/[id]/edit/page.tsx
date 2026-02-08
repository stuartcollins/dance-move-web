'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/AppShell'

interface Video {
  id: string
  url: string
  title: string | null
}

interface Move {
  id: string
  name: string
  description: string | null
  tier: number
  notes: string | null
  videos: Video[]
}

export default function EditMovePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tier, setTier] = useState(1)
  const [notes, setNotes] = useState('')
  const [existingVideos, setExistingVideos] = useState<Video[]>([])
  const [newVideoUrl, setNewVideoUrl] = useState('')

  useEffect(() => {
    async function loadMove() {
      try {
        const res = await fetch(`/api/moves/${id}`)
        if (!res.ok) throw new Error('Failed to load move')
        const move: Move = await res.json()

        setName(move.name)
        setDescription(move.description || '')
        setTier(move.tier)
        setNotes(move.notes || '')
        setExistingVideos(move.videos)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load move')
      } finally {
        setIsLoading(false)
      }
    }
    loadMove()
  }, [id])

  async function handleSave() {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/moves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          tier,
          notes,
          newVideoUrl: newVideoUrl.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      router.push(`/moves/${id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteVideo(videoId: string) {
    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete video')
      setExistingVideos(existingVideos.filter(v => v.id !== videoId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video')
    }
  }

  const tierLabels: Record<number, string> = {
    1: 'Level 1 - Fundamentals',
    2: 'Level 2 - Intermediate',
    3: 'Level 3 - Advanced',
    4: 'Level 4 - Expert',
  }

  if (isLoading) {
    return (
      <AppShell title="Edit Move">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Edit Move">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Move Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Tier */}
        <div>
          <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty Level
          </label>
          <select
            id="tier"
            value={tier}
            onChange={(e) => setTier(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {[1, 2, 3, 4].map((t) => (
              <option key={t} value={t}>{tierLabels[t]}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Your Personal Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Tips you want to remember, things your instructor said, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Existing Videos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Videos
          </label>
          {existingVideos.length > 0 ? (
            <div className="space-y-2 mb-3">
              {existingVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-medium text-gray-900 truncate">
                      {video.title || 'Video'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{video.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-3">No videos attached</p>
          )}

          {/* Add new video */}
          <div>
            <label htmlFor="newVideo" className="block text-sm text-gray-600 mb-1">
              Add a video
            </label>
            <input
              type="url"
              id="newVideo"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 px-4 font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !name.trim()}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-3 px-4 font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
