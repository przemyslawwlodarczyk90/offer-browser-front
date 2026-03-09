import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function ConfirmPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status,setStatus] = useState('loading')

  useEffect(()=>{
    if(!token){
      setStatus('error')
      return
    }

    setTimeout(()=>{
      setStatus('success')
    },1000)

  },[token])

  return (
    <div>
      {status === 'loading' && <p>Sprawdzanie tokenu...</p>}
      {status === 'success' && <p>Konto aktywowane</p>}
      {status === 'error' && <p>Nieprawidłowy token</p>}
    </div>
  )
}