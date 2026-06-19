import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

/**
 * Single video player with drawing canvas overlay + mirror + screenshot capture.
 * Exposes imperative handle for parent to control: play, pause, seek, stepFrame, capture, etc.
 */
const VideoPlayer = forwardRef(({ label, videoSrc, isDrawing, drawColor, mirrored, onTimeUpdate, onLoadedMetadata, onEnded }, ref) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(true)

  // Drawing state
  const [isDrawingNow, setIsDrawingNow] = useState(false)
  const [strokes, setStrokes] = useState([])
  const currentStrokeRef = useRef([])

  // Sync internal state with video events
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTime = () => {
      setCurrentTime(v.currentTime)
      onTimeUpdate?.(v.currentTime)
    }
    const handleMeta = () => {
      setDuration(v.duration)
      onLoadedMetadata?.(v.duration)
      resizeCanvas()
    }
    const handleEnd = () => onEnded?.()

    v.addEventListener('play', handlePlay)
    v.addEventListener('pause', handlePause)
    v.addEventListener('timeupdate', handleTime)
    v.addEventListener('loadedmetadata', handleMeta)
    v.addEventListener('ended', handleEnd)

    return () => {
      v.removeEventListener('play', handlePlay)
      v.removeEventListener('pause', handlePause)
      v.removeEventListener('timeupdate', handleTime)
      v.removeEventListener('loadedmetadata', handleMeta)
      v.removeEventListener('ended', handleEnd)
    }
  }, [onTimeUpdate, onLoadedMetadata, onEnded])

  // Resize canvas to match video display size
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
    redrawCanvas()
  }, [strokes])

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  // Redraw all strokes on canvas (account for mirror)
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return
      ctx.beginPath()
      stroke.points.forEach((pt, i) => {
        const x = mirrored ? canvas.width - pt.x : pt.x
        if (i === 0) ctx.moveTo(x, pt.y)
        else ctx.lineTo(x, pt.y)
      })
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width || 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    })
  }, [strokes, mirrored])

  // Re-redraw when mirror toggles
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Drawing handlers
  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const handleDrawStart = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawingNow(true)
    const point = getCanvasPoint(e)
    currentStrokeRef.current = [point]
  }

  const handleDrawMove = (e) => {
    if (!isDrawing || !isDrawingNow) return
    e.preventDefault()
    const point = getCanvasPoint(e)
    currentStrokeRef.current.push(point)

    // Draw incrementally for real-time feedback
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pts = currentStrokeRef.current
    if (pts.length >= 2) {
      ctx.beginPath()
      let prevX = pts[pts.length - 2].x
      let currX = pts[pts.length - 1].x
      if (mirrored) {
        prevX = canvas.width - prevX
        currX = canvas.width - currX
      }
      ctx.moveTo(prevX, pts[pts.length - 2].y)
      ctx.lineTo(currX, pts[pts.length - 1].y)
      ctx.strokeStyle = drawColor
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
  }

  const handleDrawEnd = () => {
    if (!isDrawingNow) return
    setIsDrawingNow(false)
    if (currentStrokeRef.current.length > 1) {
      setStrokes((prev) => [...prev, { points: currentStrokeRef.current, color: drawColor, width: 3 }])
    }
    currentStrokeRef.current = []
  }

  // Capture: renders video frame + drawings to an offscreen canvas, returns dataURL
  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null

    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return null

    // Create offscreen canvas at video's native resolution
    const off = document.createElement('canvas')
    off.width = vw
    off.height = vh
    const ctx = off.getContext('2d')

    // Draw video frame (with mirror if needed)
    if (mirrored) {
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, -vw, 0, vw, vh)
      ctx.restore()
    } else {
      ctx.drawImage(video, 0, 0, vw, vh)
    }

    // Scale drawings from display coords to video coords
    const scaleX = vw / canvas.width
    const scaleY = vh / canvas.height
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return
      ctx.beginPath()
      stroke.points.forEach((pt, i) => {
        const x = (mirrored ? canvas.width - pt.x : pt.x) * scaleX
        const y = pt.y * scaleY
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = (stroke.width || 3) * scaleX
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    })

    return off.toDataURL('image/png')
  }, [strokes, mirrored])

  // Imperative handle for parent control
  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    toggleMute: () => {
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted
        setMuted(videoRef.current.muted)
      }
    },
    seek: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, Math.min(time, videoRef.current.duration || 0))
      }
    },
    stepFrame: (frames) => {
      if (videoRef.current) {
        const fps = 30
        videoRef.current.currentTime += frames / fps
      }
    },
    setSpeed: (speed) => {
      if (videoRef.current) videoRef.current.playbackRate = speed
    },
    clearDrawings: () => {
      setStrokes([])
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    },
    capture: captureFrame,
    getVideo: () => videoRef.current,
    isPlaying: () => isPlaying,
    getCurrentTime: () => currentTime,
    getDuration: () => duration,
    getMirrored: () => mirrored,
  }), [isPlaying, currentTime, duration, mirrored, captureFrame, strokes])

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Label bar */}
      <div className={`flex items-center justify-between px-4 py-2 rounded-t-xl ${label.includes('Pro') ? 'bg-emerald-600/90' : 'bg-orange-600/90'}`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-wide">{label}</span>
          {mirrored && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">🪞 Mirrored</span>
          )}
        </div>
        <span className="text-xs opacity-80">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      {/* Video container */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-black overflow-hidden flex items-center justify-center border-x border-neutral-800"
        style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
      >
        {videoSrc ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              className="max-w-full max-h-full"
              playsInline
              muted={muted}
              style={{
                pointerEvents: isDrawing ? 'none' : 'auto',
                transform: mirrored ? 'scaleX(-1)' : 'none',
              }}
            />
            {/* Drawing canvas overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0"
              style={{ pointerEvents: isDrawing ? 'auto' : 'none' }}
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawMove}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
              onTouchStart={handleDrawStart}
              onTouchMove={handleDrawMove}
              onTouchEnd={handleDrawEnd}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-neutral-500">
            <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">No video loaded</span>
          </div>
        )}
      </div>
    </div>
  )
})

export default VideoPlayer
