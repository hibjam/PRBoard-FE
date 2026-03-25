import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = ''

export function useDisciplines(getHeaders) {
  const [disciplines, setDisciplines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const headers = await getHeaders()
        const res = await axios.get(`${API_BASE}/disciplines`, { headers })
        setDisciplines(res.data)
      } catch (e) {
        console.error('Failed to load disciplines', e)
        setError('Failed to load sports.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { disciplines, loading, error }
}