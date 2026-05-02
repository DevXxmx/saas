// ── src/components/ui/FileUpload.jsx ─────────────────────
import { useState, useRef, useCallback } from 'react'
import clsx from 'clsx'
import { Upload, X, FileText } from 'lucide-react'

export default function FileUpload({
  onFileSelect,
  accept,
  maxSizeMB = 10,
  label = 'Upload File',
  error,
}) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [sizeError, setSizeError] = useState(null)
  const inputRef = useRef(null)

  const handleFile = useCallback(
    (f) => {
      if (!f) return
      const maxBytes = maxSizeMB * 1024 * 1024
      if (f.size > maxBytes) {
        setSizeError(`File exceeds ${maxSizeMB}MB limit`)
        return
      }
      setSizeError(null)
      setFile(f)
      onFileSelect?.(f)
    },
    [maxSizeMB, onFileSelect]
  )

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    handleFile(f)
  }

  const handleChange = (e) => {
    const f = e.target.files?.[0]
    handleFile(f)
  }

  const clear = () => {
    setFile(null)
    setSizeError(null)
    onFileSelect?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div>
      {label && <p className="block text-sm font-medium text-slate-700 mb-1">{label}</p>}

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            dragOver
              ? 'border-primary-400 bg-primary-50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50'
          )}
        >
          <Upload className="h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm text-slate-600">
            <span className="text-primary-600 font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-400 mt-1">Max {maxSizeMB}MB</p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <FileText className="h-8 w-8 text-primary-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {(sizeError || error) && (
        <p className="mt-1 text-xs text-red-500">{sizeError || error}</p>
      )}
    </div>
  )
}
