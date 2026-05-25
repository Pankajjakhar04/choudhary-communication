import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../context/LanguageContext'

// Max dimensions for resized output
const MAX_WIDTH = 800
const MAX_HEIGHT = 800
const JPEG_QUALITY = 0.82

/**
 * Resize an image file on the client before upload.
 * Returns a new File (JPEG) capped at MAX_WIDTH × MAX_HEIGHT.
 */
function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          const resized = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
          resolve(resized)
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

/**
 * Camera capture modal — uses getUserMedia to open camera in browser
 */
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') // rear camera

  const startCamera = useCallback(async (facing) => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setError(null)
    } catch (e) {
      console.error('Camera error:', e)
      if (e.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.')
      } else if (e.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Could not access camera: ' + e.message)
      }
    }
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, []) // eslint-disable-line

  const switchCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  const capture = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
          onCapture(file)
        }
      },
      'image/jpeg',
      0.92,
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button
          type="button"
          onClick={onClose}
          className="text-white text-sm font-medium px-3 py-1.5 rounded-lg bg-white/20 active:bg-white/30"
        >
          ✕ Cancel
        </button>
        <span className="text-white text-sm font-medium">Take Photo</span>
        <button
          type="button"
          onClick={switchCamera}
          className="text-white text-sm font-medium px-3 py-1.5 rounded-lg bg-white/20 active:bg-white/30"
        >
          🔄 Flip
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="text-white text-center px-6">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Capture button */}
      {!error && (
        <div className="flex justify-center py-6 bg-black/80">
          <button
            type="button"
            onClick={capture}
            className="w-18 h-18 rounded-full border-4 border-white bg-white/20 active:bg-white/50 flex items-center justify-center transition-colors"
            style={{ width: 72, height: 72 }}
          >
            <div className="w-14 h-14 rounded-full bg-white" style={{ width: 56, height: 56 }} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function ImageUpload({ file, setFile, label }) {
  const { t } = useLang()
  const [preview, setPreview] = useState(null)
  const [resizing, setResizing] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
    return () => { if (reader.readyState === 1) reader.abort() }
  }, [file])

  const handleFile = async (raw) => {
    if (!raw) return
    setResizing(true)
    try {
      const optimized = await resizeImage(raw)
      setFile(optimized)
    } catch {
      setFile(raw)
    } finally {
      setResizing(false)
    }
  }

  const onFileChange = (e) => {
    handleFile(e.target.files?.[0] || null)
    e.target.value = ''
  }

  const onCameraCapture = (capturedFile) => {
    setShowCamera(false)
    handleFile(capturedFile)
  }

  const clearImage = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label || t('uploadImage')}</label>

      {/* Preview area */}
      <div className="mb-3">
        <div className="w-full max-w-[200px] aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200 relative">
          {resizing ? (
            <div className="text-sm text-muted flex flex-col items-center gap-1">
              <span className="animate-spin text-xl">⏳</span>
              <span>Optimizing...</span>
            </div>
          ) : preview ? (
            <>
              <img src={preview} alt="preview" className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs leading-none"
              >
                ✕
              </button>
            </>
          ) : (
            <div className="text-muted text-sm flex flex-col items-center gap-1">
              <span className="text-3xl opacity-40">📷</span>
              <span>{t('preview')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          🖼️ Choose from Gallery
        </button>

        <button
          type="button"
          onClick={() => setShowCamera(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-primary rounded-lg text-sm font-medium transition-colors"
        >
          📸 Take Photo
        </button>
      </div>

      {file && !resizing && (
        <p className="text-xs text-muted mt-2">
          ✅ {file.name} ({(file.size / 1024).toFixed(0)} KB)
        </p>
      )}

      {/* Hidden file input for gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Camera modal */}
      {showCamera && (
        <CameraModal
          onCapture={onCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}
