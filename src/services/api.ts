type ApiResponse<T> = { success?: boolean; message?: string; data?: T }

const apiBaseUrl = (import.meta.env.VITE_AUTH_API_URL || '').replace(/\/$/, '')

export async function postApi<TResponse>(path: string, payload: unknown): Promise<TResponse> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Unable to reach the OTP service. Start the server and try again.')
  }

  const result = await response.json().catch(() => ({})) as ApiResponse<TResponse>
  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'The OTP request could not be completed.')
  }
  if (result.data === undefined) return result as TResponse
  return result.data
}
