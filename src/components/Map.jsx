import { useEffect, useRef } from 'react'

export function MapComponent({ address }) {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!window.google) return

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0] && mapRef.current) {
        const location = results[0].geometry.location
        const map = new window.google.maps.Map(mapRef.current, {
          center: location,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
        })
        
        new window.google.maps.Marker({
          map,
          position: location,
        })
      } else {
        console.error('Geocode was not successful for the following reason:', status)
      }
    })
  }, [address])

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full min-h-[300px] rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground"
    >
      Loading map for {address}...
    </div>
  )
}
