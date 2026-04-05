import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { X, UploadCloud, Loader2, ImageIcon, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
const ALL_FACILITIES = [
  'WiFi', 'Parking', 'Food', 'Electricity', 'Laundry', 'AC', 'Gym', 'Security',
  'TV', 'Attached bathroom', 'cctv', 'water', 'drinking water', 'bed', 'study table',
  'nearby transport', 'nearby hospital', 'nearby grocery store', 'fire safety',
  'room cleaning', 'Maintenance service'
]

/**
 * Parses a Google Maps link or plain address into a format suitable for embedding.
 * Ported from apimap.html logic.
 */
const parseMapInput = (input) => {
  if (!input) return null;
  input = input.trim();
  
  if (input.startsWith('http') || input.startsWith('www.') || input.includes('google.com')) {
    try {
      // 1. Check for data parameters (!3d and !4d)
      const latMatch = input.match(/!3d(-?\d+\.\d+)/);
      const lngMatch = input.match(/!4d(-?\d+\.\d+)/);
      if (latMatch && lngMatch) return `${latMatch[1]},${lngMatch[1]}`;

      // 2. Check for @lat,lng format
      const coordMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) return `${coordMatch[1]},${coordMatch[2]}`;

      // 3. Extract place name from /place/ or /search/ URLs
      const placeMatch = input.match(/\/(?:place|search)\/([^/@?]+)/);
      if (placeMatch && placeMatch[1]) return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      
      // 4. Extract from standard search query (?q=)
      const urlObj = new URL(input.startsWith('http') ? input : 'https://' + input);
      const qParam = urlObj.searchParams.get('q');
      if (qParam) return decodeURIComponent(qParam.replace(/\+/g, ' '));
    } catch (e) {
      console.log("URL parsing failed, falling back to string processing.");
    }
  }
  return input;
};

/**
 * Compress an image File to a JPEG Blob at reduced quality.
 * Falls back to the original file if canvas is unsupported.
 */
async function compressImage(file, maxWidthPx = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxWidthPx / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export function PropertyForm({ onSubmit, onCancel, initial, isPG = false, isLoading = false }) {
  const [title, setTitle] = useState(initial?.title || '')
  // propertyFor: 'male' | 'female' | 'both'
  const [propertyFor, setPropertyFor] = useState(initial?.propertyFor || 'both')
  const [price, setPrice] = useState(initial?.price?.toString() || '')
  const [location, setLocation] = useState(initial?.location || '')
  const [mapEmbed, setMapEmbed] = useState(initial?.mapEmbed || '')
  const [facilities, setFacilities] = useState(initial?.facilities || [])
  const [rules, setRules] = useState(initial?.rules?.join(', ') || '')
  const [livingAlone, setLivingAlone] = useState(initial?.livingAlone || false)
  const [rentDuration, setRentDuration] = useState(initial?.rentDuration || 'Monthly')
  const [distanceRange, setDistanceRange] = useState(initial?.distanceRange || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [available, setAvailable] = useState(initial?.available ?? true)
  const [currentOccupants, setCurrentOccupants] = useState(initial?.currentOccupants?.toString() || '')
  const [totalCapacity, setTotalCapacity] = useState(initial?.totalCapacity?.toString() || '')
  const [roomType, setRoomType] = useState(initial?.roomType || 'sharing')
  const [foodIncluded, setFoodIncluded] = useState(initial?.foodIncluded || false)
  const [images, setImages] = useState(initial?.images || [])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  // Local preview blobs (before upload completes)
  const [previews, setPreviews] = useState([])
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Show local previews immediately
    const localPreviews = files.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...localPreviews])
    setUploadError('')
    setIsUploading(true)

    try {
      const uploadedUrls = []

      for (const file of files) {
        // Compress before uploading
        const compressed = await compressImage(file)
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from('property-images')
          .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })

        if (uploadErr) throw new Error(uploadErr.message)

        const { data: urlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(path)

        if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl)
      }

      setImages((prev) => [...prev, ...uploadedUrls])
    } catch (err) {
      console.error('[PropertyForm] Image upload failed:', err)
      let msg = err.message
      if (msg.includes('bucket_id')) msg = 'Storage bucket "property-images" not found or not public. Check the Setup Guide.'
      setUploadError(`Upload failed: ${msg}`)
    } finally {
      setIsUploading(false)
      // Revoke local preview blobs
      localPreviews.forEach((u) => URL.revokeObjectURL(u))
      setPreviews([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleFacility = (f) => {
    setFacilities((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      title,
      propertyFor,
      price: price === '' ? 0 : Number(price),
      location,
      mapEmbed: mapEmbed.trim(),
      facilities,
      rules: rules.split(',').map((r) => r.trim()).filter(Boolean),
      livingAlone,
      rentDuration,
      distanceRange,
      notes,
      images,
      available,
    }
    if (isPG) {
      data.currentOccupants = Number(currentOccupants) || 0
      data.totalCapacity = Number(totalCapacity) || 0
      data.roomType = roomType
      data.foodIncluded = foodIncluded
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-xl font-bold text-card-foreground">
            {initial ? 'Edit Property' : 'Add New Property'}
          </h2>
        </div>
        <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Title */}
        <div className="md:col-span-2">
          <Label htmlFor="title">Property Title</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Spacious 2BHK Near Campus"
            className="mt-1.5 rounded-xl"
          />
        </div>

        {/* Property For — Boys / Girls / Both */}
        <div role="group" aria-labelledby="property-for-label">
          <Label id="property-for-label">Property For</Label>
          <div className="mt-1.5 flex gap-2">
            {[
              { value: 'boys', label: 'Boys' },
              { value: 'girls', label: 'Girls' },
              { value: 'both', label: 'Girls & Boys' },
            ].map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant={propertyFor === value ? 'default' : 'outline'}
                size="sm"
                className="rounded-xl flex-1"
                onClick={() => setPropertyFor(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <Label htmlFor="price">Price (INR / month)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="8000"
            className="mt-1.5 rounded-xl"
          />
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <Label htmlFor="location">Location / Address</Label>
          <Input
            id="location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="MG Road, Near Engineering College"
            className="mt-1.5 rounded-xl"
          />
        </div>

        {/* Map Embed */}
        <div className="md:col-span-2">
          <Label htmlFor="locationInput">
            Search Location / Google Maps Link
            <span className="text-muted-foreground font-normal ml-1">(Type address or paste link)</span>
          </Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="locationInput"
              placeholder="e.g., 123 Main St, Mumbai or paste Google Maps URL"
              className="rounded-xl flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const finalLoc = parseMapInput(e.target.value);
                  if (finalLoc) {
                    setMapEmbed(`https://maps.google.com/maps?q=${encodeURIComponent(finalLoc)}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
                  }
                }
              }}
              onBlur={(e) => {
                const finalLoc = parseMapInput(e.target.value);
                if (finalLoc) {
                  setMapEmbed(`https://maps.google.com/maps?q=${encodeURIComponent(finalLoc)}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary"
              className="rounded-xl"
              onClick={() => {
                const input = document.getElementById('locationInput').value;
                const finalLoc = parseMapInput(input);
                if (finalLoc) {
                  setMapEmbed(`https://maps.google.com/maps?q=${encodeURIComponent(finalLoc)}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
                }
              }}
            >
              Preview Map
            </Button>
          </div>
          
          <p className="mt-2 text-xs text-muted-foreground">
            Enter your property address or paste a link from Google Maps to show it on the student section.
          </p>

          {mapEmbed && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">Live Map Preview:</span>
                <button 
                  type="button"
                  onClick={() => setMapEmbed('')}
                  className="text-xs text-destructive hover:underline"
                >
                  Clear Map
                </button>
              </div>
              <div className="aspect-video overflow-hidden rounded-2xl border shadow-sm">
                <iframe
                  src={mapEmbed}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map preview"
                />
              </div>
            </div>
          )}
        </div>

        {/* Distance + Rent Duration */}
        <div>
          <Label htmlFor="distanceRange">Distance from Campus (km)</Label>
          <Input
            id="distanceRange"
            name="distanceRange"
            value={distanceRange}
            onChange={(e) => setDistanceRange(e.target.value)}
            placeholder="0.5 km"
            className="mt-1.5 rounded-xl"
          />
        </div>
        <div>
          <Label htmlFor="rentDuration">Rent Duration</Label>
          <select
            id="rentDuration"
            name="rentDuration"
            value={rentDuration}
            onChange={(e) => setRentDuration(e.target.value)}
            className="mt-1.5 flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Semi-Annual">Semi-Annual</option>
            <option value="Annual">Annual</option>
          </select>
        </div>

        {/* Facilities */}
        <div className="md:col-span-2" role="group" aria-labelledby="facilities-label">
          <Label id="facilities-label">Facilities</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_FACILITIES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFacility(f)}
                className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all ${
                  facilities.includes(f)
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="md:col-span-2">
          <Label htmlFor="rules">Rules & Regulations (comma-separated)</Label>
          <Textarea
            id="rules"
            name="rules"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="No smoking, No pets, Visitors allowed till 9 PM"
            className="mt-1.5 rounded-xl"
          />
        </div>

        {/* PG-specific fields */}
        {isPG && (
          <>
            <div>
              <Label htmlFor="currentOccupants">Current Occupants</Label>
              <Input
                id="currentOccupants"
                name="currentOccupants"
                type="number"
                value={currentOccupants}
                onChange={(e) => setCurrentOccupants(e.target.value)}
                placeholder="15"
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="totalCapacity">Total Capacity</Label>
              <Input
                id="totalCapacity"
                name="totalCapacity"
                type="number"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(e.target.value)}
                placeholder="30"
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div role="group" aria-labelledby="room-type-label">
              <Label id="room-type-label">Room Type</Label>
              <div className="mt-1.5 flex gap-2">
                <Button
                  type="button"
                  variant={roomType === 'private' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setRoomType('private')}
                >
                  Private
                </Button>
                <Button
                  type="button"
                  variant={roomType === 'sharing' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setRoomType('sharing')}
                >
                  Sharing
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="foodIncluded" checked={foodIncluded} onCheckedChange={setFoodIncluded} />
              <Label htmlFor="foodIncluded">Food Included</Label>
            </div>
          </>
        )}

        {/* Toggles */}
        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
          <Switch id="livingAlone" checked={livingAlone} onCheckedChange={setLivingAlone} />
          <Label htmlFor="livingAlone">Living Alone Option</Label>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
          <Switch id="available" checked={available} onCheckedChange={setAvailable} />
          <Label htmlFor="available">Available</Label>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <Label htmlFor="notes">Extra Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details..."
            className="mt-1.5 rounded-xl"
          />
        </div>

        {/* ─── Image Upload (Supabase Storage) ─── */}
        <div className="md:col-span-2">
          <Label>Property Images</Label>
          <div className="mt-2">
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-xl"
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                {isUploading ? 'Uploading...' : 'Upload Images'}
              </Button>
              <input
                id="property-images-upload"
                name="property-images-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <span className="text-sm text-muted-foreground">
                {images.length} image{images.length !== 1 ? 's' : ''} added
              </span>
            </div>

            {/* Upload error */}
            {uploadError && (
              <p className="mt-2 text-sm text-destructive">{uploadError}</p>
            )}

            {/* Uploading placeholders */}
            {isUploading && previews.length > 0 && (
              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Compressing and uploading {previews.length} image{previews.length !== 1 ? 's' : ''}…
              </div>
            )}

            {/* Uploaded image grid */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((url, i) => (
                  <div
                    key={i}
                    className="group relative aspect-video overflow-hidden rounded-xl border bg-secondary"
                  >
                    <img
                      src={url}
                      alt={`Property image ${i + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/70"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-1 left-2 text-[9px] text-white/70 font-medium">
                      {i + 1}/{images.length}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {images.length === 0 && !isUploading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                No images added yet. Upload some to make your listing stand out.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isUploading || isLoading} className="flex-1 rounded-xl h-11 shadow-lg shadow-primary/20">
          {(isUploading || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploading ? 'Uploading...' : isLoading ? 'Saving...' : initial ? 'Save Changes' : 'Add Property'}
        </Button>
        <Button type="button" variant="outline" disabled={isLoading} className="rounded-xl" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
