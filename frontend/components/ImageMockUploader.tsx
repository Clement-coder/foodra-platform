"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface ImageMockUploaderProps {
  onImageSelect: (base64: string) => void
  currentImage?: string
  label?: string
  error?: string
}

export function ImageMockUploader({
  onImageSelect,
  currentImage,
  label = "Upload Image",
  error,
}: ImageMockUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Create base64 preview using FileReader
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setPreview(base64String)
      onImageSelect(base64String)
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    setPreview(null)
    onImageSelect("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        <span className="text-red-500 ml-1">*</span>
      </label>

      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          error ? "border-red-500" : "border-input hover:border-[#118C4C]"
        }`}
      >
        {preview ? (
          <div className="relative">
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
              <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">Click to select an image or drag and drop</p>
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              Select Image
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label={label}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
