export type PunchLocation = { latitude: number; longitude: number }

export function capturePunchLocation(): Promise<PunchLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('This browser does not support GPS location.'))
    if (!window.isSecureContext) return reject(new Error('GPS requires a secure HTTPS connection.'))
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new Error(
        error.code === error.PERMISSION_DENIED
          ? 'Location access is blocked. In Chrome, open the site controls beside the address bar → Site settings → Location → Allow, reload this page, then try again.'
          : error.code === error.TIMEOUT
            ? 'Could not get your location in time. Move to an area with GPS signal and retry.'
            : 'Current location is unavailable. Check device location settings and retry.',
      )),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )
  })
}

export function compressPunchPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read the selected photo.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Please select a valid image.'))
      image.onload = () => {
        const scale = Math.min(1, 720 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        const context = canvas.getContext('2d')
        if (!context) return reject(new Error('Unable to process the selected photo.'))
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
