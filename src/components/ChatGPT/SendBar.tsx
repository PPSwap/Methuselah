// Viktor gjorgjevski 7/3/2025 added the functionality to upload and select file

import React, { KeyboardEventHandler, useRef, useState, useEffect } from 'react'
import { ClearOutlined, SendOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { ChatRole, SendBarProps } from './interface'
import Show from './Show'

const SendBar = (props: SendBarProps) => {
  const { loading, disabled, onSend, onClear, onStop } = props
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<{ _id: string; originalName: string }[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string>('')

  useEffect(() => {
    fetch('http://localhost:8080/api/my-files', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setFiles(data.files || []))
      .catch(() => setFiles([]))
  }, [])

  const onInputAutoSize = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
    }
  }

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.style.height = 'auto'
      onClear()
    }
  }

  const handleSend = () => {
    const content = inputRef.current?.value
    if (content) {
      inputRef.current!.value = ''
      inputRef.current!.style.height = 'auto'
      // Send selected fileId as part of the message!
      onSend({
        content,
        role: ChatRole.User,
        fileId: selectedFileId || null
      })
    }
  }

  const onKeydown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.shiftKey) return
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend()
  }

  const handleFileUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const acceptedTypes = [
      'application/pdf',
      'text/csv',
      'application/json',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'image/png',
      'image/jpeg'
    ]

    if (!acceptedTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload a PDF, CSV, TXT, JSON, XLSX, PNG, or JPG file.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8080/api/uploadFile', {
        method: 'POST',
        body: formData,
        credentials: 'include', // needed for auth cookies!
      })

      const data = await response.json()
      if (response.ok) {
        alert(`File uploaded successfully: ${data.fileName}`)
        // Add new file to dropdown immediately!
        setFiles(f => [...f, { _id: data.fileId, originalName: data.fileName }])
      } else {
        alert('Upload failed: ' + (data.error || 'unknown error'))
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message)
    }
  }

  return (
  <Show
    fallback={
      <div className="thinking">
        <span>Please wait ...</span>
        <div className="stop" onClick={onStop}>Stop</div>
      </div>
    }
    loading={loading}
  >
    <div
      className="send-bar"
      style={{
        background: '#9AB7A9',
        borderRadius: 16,
        padding: '16px 20px',
        minHeight: 64,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}
    >
      {/* Attach file controls (smaller) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <select
          value={selectedFileId}
          onChange={e => setSelectedFileId(e.target.value)}
          style={{
            minWidth: 38,  
            maxWidth: 150,
            height: 22, 
            fontSize: 12,
            padding: '2px 6px',
            borderRadius: 7,
            border: '1px solid #B7B7B7',
            background: '#F4F4F0'
          }}
          disabled={disabled}
        >
          <option value="">📄</option>
          {files.map(f => (
            <option key={f._id} value={f._id}>{f.originalName}</option>
          ))}
        </select>
        {/* File upload Button */}
        <button
          className="button"
          title="Upload"
          disabled={disabled}
          onClick={handleFileUploadClick}
          style={{
            minWidth: 30,
            minHeight: 30,
            borderRadius: 7,
            padding: 0,
            fontSize: 15,
            background: '#ECECE6'
          }}
        >
          <FolderOpenOutlined className="chat-icon-black-outline" />
        </button>
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".pdf,.csv,.txt,.xlsx,.json,.png,.jpg,.jpeg"
        />
      </div>

      {/* Text Input */}
      <textarea
        ref={inputRef}
        className="input"
        disabled={disabled}
        placeholder="Methuselah, I need your wellness wisdom regarding..."
        autoComplete="off"
        rows={1}
        style={{
          flex: 1,
          border: 'none',
          borderRadius: 10,
          padding: '12px',
          backgroundColor: '#F1F1EA',
          color: '#1E1E1E',
          fontSize: 17,
          marginLeft: 4
        }}
        onKeyDown={onKeydown}
        onInput={onInputAutoSize}
      />

      <button
        className="button"
        title="Send"
        disabled={disabled}
        onClick={handleSend}
        style={{
          minWidth: 38,
          minHeight: 38,
          borderRadius: 12,
          fontSize: 21,
          background: '#ECECE6'
        }}
      >
        <SendOutlined className="chat-icon-black-outline" />
      </button>

      <button
        className="button"
        title="Clear"
        disabled={disabled}
        onClick={handleClear}
        style={{
          minWidth: 38,
          minHeight: 38,
          borderRadius: 12,
          fontSize: 21,
          background: '#ECECE6'
        }}
      >
        <ClearOutlined className="chat-icon-black-outline" />
      </button>
    </div>
  </Show>
)

}

export default SendBar
