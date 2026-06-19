import { useRef, useState, useCallback } from 'react'
import VideoPlayer from './components/VideoPlayer'
import { referenceVideos, categories } from './data/referenceVideos'

const SPEEDS = [0.25, 0.5, 0.75, 1]
const COLORS = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#ffffff']

export default function App() {
  const proRef = useRef(null)
  const userRef = useRef(null)

  const [refVideo, setRefVideo] = useState(null)
  const [userVideo, setUserVideo] = useState(null)
  const [userVideoName, setUserVideoName] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [maxDuration, setMaxDuration] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawColor, setDrawColor] = useState(COLORS[0])
  const [proMirrored, setProMirrored] = useState(false)
  const [userMirrored, setUserMirrored] = useState(false)
  const [syncMode, setSyncMode] = useState(true)

  const filteredVideos = activeCategory === 'All'
    ? referenceVideos
    : referenceVideos.filter((v) => v.category === activeCategory)

  // Sync playback: play/pause both
  const handlePlayPause = useCallback(() => {
    const pro = proRef.current?.getVideo()
    const user = userRef.current?.getVideo()
    if (!pro && !user) return

    if (isPlaying) {
      pro?.pause()
      user?.pause()
      setIsPlaying(false)
    } else {
      if (pro) pro.playbackRate = speed
      if (user) user.playbackRate = speed
      pro?.play()
      user?.play()
      setIsPlaying(true)
    }
  }, [isPlaying, speed])

  // Sync seek: drag timeline moves both
  const handleSeek = useCallback((time) => {
    proRef.current?.seek(time)
    userRef.current?.seek(time)
    setCurrentTime(time)
  }, [])

  // Frame stepping
  const handleStepFrame = useCallback((frames) => {
    proRef.current?.stepFrame(frames)
    userRef.current?.stepFrame(frames)
  }, [])

  // Speed change
  const handleSpeedChange = useCallback((newSpeed) => {
    setSpeed(newSpeed)
    const pro = proRef.current?.getVideo()
    const user = userRef.current?.getVideo()
    if (pro) pro.playbackRate = newSpeed
    if (user) user.playbackRate = newSpeed
  }, [])

  // Clear all drawings
  const handleClearDrawings = useCallback(() => {
    proRef.current?.clearDrawings()
    userRef.current?.clearDrawings()
  }, [])

  // Toggle mirror on a specific player
  const handleToggleMirror = useCallback((which) => {
    if (which === 'pro') setProMirrored((m) => !m)
    if (which === 'user') setUserMirrored((m) => !m)
  }, [])

  // Screenshot: capture both videos side by side into one image and download
  const handleScreenshot = useCallback(() => {
    const proData = proRef.current?.capture()
    const userData = userRef.current?.capture()

    if (!proData && !userData) return

    const img1 = new Image()
    const img2 = new Image()
    let loaded = 0
    const total = (proData ? 1 : 0) + (userData ? 1 : 0)

    const onBothLoaded = () => {
      loaded++
      if (loaded < total) return

      const gap = 20
      const labelH = 40
      const padding = 16
      const maxW = 960
      const halfW = (maxW - gap) / 2

      let h1 = 0, w1 = 0, h2 = 0, w2 = 0
      if (img1.src) { w1 = img1.naturalWidth; h1 = img1.naturalHeight }
      if (img2.src) { w2 = img2.naturalWidth; h2 = img2.naturalHeight }

      // Scale both to same height
      const targetH = 360
      const s1 = img1.src ? targetH / h1 : 0
      const s2 = img2.src ? targetH / h2 : 0

      const fw1 = w1 * s1
      const fw2 = w2 * s2
      const totalW = Math.max(fw1, 0) + (img1.src && img2.src ? gap : 0) + Math.max(fw2, 0)
      const finalH = targetH + labelH + padding * 2

      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(totalW + padding * 2)
      canvas.height = finalH
      const ctx = canvas.getContext('2d')

      // Background
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      let x = padding
      if (img1.src) {
        // Label
        ctx.fillStyle = '#059669'
        ctx.fillRect(x, padding, fw1, labelH)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 18px sans-serif'
        ctx.fillText('🎾 Pro Reference', x + 12, padding + 27)
        // Image
        ctx.drawImage(img1, x, padding + labelH, fw1, targetH)
        x += fw1 + gap
      }
      if (img2.src) {
        ctx.fillStyle = '#ea580c'
        ctx.fillRect(x, padding, fw2, labelH)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 18px sans-serif'
        ctx.fillText('📹 Your Video', x + 12, padding + 27)
        ctx.drawImage(img2, x, padding + labelH, fw2, targetH)
      }

      // Download
      const link = document.createElement('a')
      link.download = `tennis-compare-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    if (proData) img1.onload = onBothLoaded
    if (userData) img2.onload = onBothLoaded
    if (proData) img1.src = proData
    if (userData) img2.src = userData
    if (!proData && userData) { img2.onload = onBothLoaded; img2.src = userData }
    if (proData && !userData) { img1.onload = onBothLoaded; img1.src = proData }
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setUserVideo(url)
    setUserVideoName(file.name)
    setIsPlaying(false)
  }, [])

  // Drag & drop
  const [isDragging, setIsDragging] = useState(false)
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('video/')) return
    const url = URL.createObjectURL(file)
    setUserVideo(url)
    setUserVideoName(file.name)
    setIsPlaying(false)
  }, [])

  // On time update from either video
  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time)
  }, [])

  const handleLoadedMeta = useCallback((dur) => {
    setMaxDuration((prev) => Math.max(prev, dur))
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const bothReady = refVideo && userVideo

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)' }}>
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full court-gradient flex items-center justify-center text-2xl">🎾</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">TennisForm Compare</h1>
            <p className="text-xs text-neutral-400">Upload your video, compare with pro technique</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className={`px-3 py-1 rounded-full ${bothReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700/50'}`}>
            {bothReady ? '✓ Ready to compare' : 'Select videos below'}
          </span>
        </div>
      </header>

      <main className="flex-1 flex">
        {/* Sidebar - Video Selection */}
        <aside className="w-80 glass border-r border-neutral-800 flex flex-col overflow-hidden">
          {/* Upload Section */}
          <div className="p-4 border-b border-neutral-800">
            <h2 className="text-sm font-bold text-neutral-300 mb-3 flex items-center gap-2">
              <span className="text-orange-400">▶</span> Your Video
            </h2>
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`block cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all ${
                isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-700 hover:border-neutral-600'
              }`}
            >
              <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
              {userVideo ? (
                <div className="text-center">
                  <div className="text-emerald-400 text-2xl mb-1">✓</div>
                  <p className="text-xs text-neutral-300 truncate">{userVideoName}</p>
                  <p className="text-xs text-neutral-500 mt-1">Click to replace</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-3xl mb-2 opacity-50">📹</div>
                  <p className="text-sm text-neutral-300">Drop video here<br />or click to browse</p>
                  <p className="text-xs text-neutral-500 mt-1">MP4, MOV, WebM</p>
                </div>
              )}
            </label>
          </div>

          {/* Reference Video Library */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                <span className="text-emerald-400">★</span> Pro Reference Library
              </h2>
            </div>
            {/* Category filter */}
            <div className="px-4 pb-2 flex gap-1 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Video list */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {filteredVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => { setRefVideo(video); setIsPlaying(false) }}
                  className={`w-full text-left rounded-xl p-3 transition-all border ${
                    refVideo?.id === video.id
                      ? 'bg-emerald-600/15 border-emerald-600/50'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-200">{video.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{video.description}</p>
                      <div className="flex gap-1.5 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">{video.category}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">{video.level}</span>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-500">{video.duration}</span>
                  </div>
                  {refVideo?.id === video.id && (
                    <div className="mt-2 text-xs text-emerald-400 font-medium">✓ Selected</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main comparison area */}
        <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
          {/* Comparison videos */}
          <div className="flex gap-4 flex-1 min-h-0">
            {/* Pro video */}
            <div className="flex-1 rounded-xl overflow-hidden flex flex-col border border-neutral-800">
              <VideoPlayer
                ref={proRef}
                label="🎾 Pro Reference"
                videoSrc={refVideo?.videoUrl}
                isDrawing={isDrawing}
                drawColor={drawColor}
                mirrored={proMirrored}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMeta}
                onEnded={handleEnded}
              />
            </div>
            {/* User video */}
            <div className="flex-1 rounded-xl overflow-hidden flex flex-col border border-neutral-800">
              <VideoPlayer
                ref={userRef}
                label="📹 Your Video"
                videoSrc={userVideo}
                isDrawing={isDrawing}
                drawColor={drawColor}
                mirrored={userMirrored}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMeta}
                onEnded={handleEnded}
              />
            </div>
          </div>

          {/* Shared controls bar */}
          <div className="glass rounded-xl p-4 space-y-3">
            {/* Timeline */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 tabular-nums w-12">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={maxDuration || 100}
                step={0.01}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1"
                disabled={!bothReady}
              />
              <span className="text-xs text-neutral-400 tabular-nums w-12">{formatTime(maxDuration)}</span>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                  onClick={handlePlayPause}
                  disabled={!bothReady}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    bothReady ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-neutral-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>

                {/* Frame step back */}
                <button
                  onClick={() => handleStepFrame(-1)}
                  disabled={!bothReady}
                  className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-sm transition-all flex items-center gap-1"
                  title="Step back 1 frame"
                >
                  ⏮ <span className="text-xs">1f</span>
                </button>

                {/* Frame step forward */}
                <button
                  onClick={() => handleStepFrame(1)}
                  disabled={!bothReady}
                  className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-sm transition-all flex items-center gap-1"
                  title="Step forward 1 frame"
                >
                  <span className="text-xs">1f</span> ⏭
                </button>

                {/* Speed control */}
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-xs text-neutral-500">Speed:</span>
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        speed === s
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawing tools */}
              <div className="flex items-center gap-2">
                {/* Mirror toggles */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800/60">
                  <span className="text-xs text-neutral-500">🪞</span>
                  <button
                    onClick={() => handleToggleMirror('pro')}
                    disabled={!refVideo}
                    className="px-2 py-1 rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 transition-all"
                  >
                    Pro
                  </button>
                  <button
                    onClick={() => handleToggleMirror('user')}
                    disabled={!userVideo}
                    className="px-2 py-1 rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 transition-all"
                  >
                    Mine
                  </button>
                </div>

                {/* Screenshot */}
                <button
                  onClick={handleScreenshot}
                  disabled={!bothReady}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                >
                  📸 Save
                </button>

                <button
                  onClick={() => setIsDrawing(!isDrawing)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isDrawing ? 'bg-blue-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  ✏️ Draw
                </button>
                {isDrawing && (
                  <>
                    <div className="flex gap-1">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setDrawColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            drawColor === c ? 'border-white scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleClearDrawings}
                      className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-red-900 text-neutral-300 text-xs transition-all"
                    >
                      🗑 Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Not ready hint */}
          {!bothReady && (
            <div className="text-center py-2 text-sm text-neutral-500">
              {!refVideo && !userVideo && '← Select a pro video from the library and upload your video to start comparing'}
              {refVideo && !userVideo && '👈 Upload your video to start comparing'}
              {!refVideo && userVideo && '👈 Select a pro reference video from the library'}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
