'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/AppShell'

interface MoveSuggestion {
  name: string
  description: string
  tier: number
  relatedMoves: string[]
  suggestedVideos: { title: string; searchQuery: string }[]
}

export default function NewMovePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [suggestion, setSuggestion] = useState<MoveSuggestion | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editable fields after suggestion is loaded
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedTier, setEditedTier] = useState(1)
  const [selectedVideo, setSelectedVideo] = useState('')
  const [customVideoUrl, setCustomVideoUrl] = useState('')
  const [useCustomVideo, setUseCustomVideo] = useState(false)
  const [personalNotes, setPersonalNotes] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)
    setSuggestion(null)

    try {
      const res = await fetch('/api/moves/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveName: searchQuery }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to look up move')
      }

      const data: MoveSuggestion = await res.json()
      setSuggestion(data)
      setEditedName(data.name)
      setEditedDescription(data.description)
      setEditedTier(data.tier)
      setUseCustomVideo(false)
      setCustomVideoUrl('')
      if (data.suggestedVideos.length > 0) {
        setSelectedVideo(data.suggestedVideos[0].searchQuery)
      } else {
        setSelectedVideo('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSearching(false)
    }
  }

  async function handleSave() {
    setIsSubmitting(true)
    setError(null)

    try {
      let videoUrl = ''
      if (useCustomVideo && customVideoUrl.trim()) {
        videoUrl = customVideoUrl.trim()
      } else if (selectedVideo) {
        videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedVideo)}`
      }

      const res = await fetch('/api/moves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription,
          tier: editedTier,
          notes: personalNotes,
          videoUrl,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save move')
      }

      router.push('/moves')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tierLabels: Record<number, string> = {
    1: 'Level 1 - Fundamentals',
    2: 'Level 2 - Intermediate',
    3: 'Level 3 - Advanced',
    4: 'Level 4 - Expert',
  }

  return (
    <AppShell title="Add Move">
      <div className="space-y-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            What move did you learn?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Sugar Push, Whip, Starter Step"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isSearching ? 'Looking up...' : 'Look up'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            We&apos;ll find information about this move and suggest videos
          </p>
        </form>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Looking up &quot;{searchQuery}&quot;...</p>
          </div>
        )}

        {/* Suggestion Results */}
        {suggestion && !isSearching && (
          <div className="space-y-6 border-t pt-6">
            <div className="bg-green-50 text-green-800 rounded-lg p-3 text-sm">
              Found information for this move. Review and edit below, then save.
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Move Name
              </label>
              <input
                type="text"
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
                <span className="text-gray-400 font-normal ml-2">(AI-suggested)</span>
              </label>
              <textarea
                id="description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Tier */}
            <div>
              <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
                <span className="text-gray-400 font-normal ml-2">(AI-suggested)</span>
              </label>
              <select
                id="tier"
                value={editedTier}
                onChange={(e) => setEditedTier(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {[1, 2, 3, 4].map((t) => (
                  <option key={t} value={t}>{tierLabels[t]}</option>
                ))}
              </select>
            </div>

            {/* Video Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video
              </label>
              <div className="space-y-2">
                {/* Suggested video searches */}
                {suggestion.suggestedVideos.map((video, index) => (
                  <label
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      !useCustomVideo && selectedVideo === video.searchQuery
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="video"
                      checked={!useCustomVideo && selectedVideo === video.searchQuery}
                      onChange={() => {
                        setSelectedVideo(video.searchQuery)
                        setUseCustomVideo(false)
                      }}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{video.title}</p>
                      <p className="text-sm text-gray-500">YouTube search</p>
                    </div>
                  </label>
                ))}

                {/* Custom video URL option */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    useCustomVideo
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="video"
                    checked={useCustomVideo}
                    onChange={() => setUseCustomVideo(true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Link a specific video</p>
                    <p className="text-sm text-gray-500 mb-2">From a class, workshop, or instructor you like</p>
                    {useCustomVideo && (
                      <input
                        type="url"
                        value={customVideoUrl}
                        onChange={(e) => setCustomVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                </label>

                {/* No video option */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    !useCustomVideo && selectedVideo === ''
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="video"
                    checked={!useCustomVideo && selectedVideo === ''}
                    onChange={() => {
                      setSelectedVideo('')
                      setUseCustomVideo(false)
                    }}
                  />
                  <span className="text-gray-600">No video</span>
                </label>
              </div>
            </div>

            {/* Related Moves */}
            {suggestion.relatedMoves.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Moves
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestion.relatedMoves.map((move, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {move}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  These won&apos;t be linked yet, but you can add them later
                </p>
              </div>
            )}

            {/* Personal Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Your Personal Notes
                <span className="text-gray-400 font-normal ml-2">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                rows={3}
                placeholder="Tips you want to remember, things your instructor said, etc."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setSuggestion(null)
                  setSearchQuery('')
                }}
                className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 px-4 font-medium hover:bg-gray-200 transition-colors"
              >
                Start Over
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || !editedName.trim()}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-3 px-4 font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save to Journal'}
              </button>
            </div>
          </div>
        )}

        {/* Initial State - No search yet */}
        {!suggestion && !isSearching && !error && (
          <div className="text-center py-8 text-gray-500">
            <p>Type the name of a move to get started</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
