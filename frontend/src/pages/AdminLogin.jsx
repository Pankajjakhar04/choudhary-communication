import React, { useState } from 'react'
import { adminLogin } from '../api/api'
import { useLang } from '../context/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import AuthContext from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function AdminLogin(){
  const { t } = useLang()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useContext(AuthContext)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try{
      const res = await adminLogin({ username, password })
      login(res.data.token)
      navigate('/admin/dashboard')
    }catch(err){
      setError(t('loginError'))
      toast.error(t('loginError'))
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl mx-auto">CC</div>
          <h2 className="text-lg font-semibold mt-3">{t('loginTitle') || 'Admin Login'}</h2>
        </div>
        {error && <div className="text-danger mb-3 text-sm text-center">{error}</div>}
        <label className="block mb-3">
          <span className="text-sm font-medium">{t('username')}</span>
          <input
            className="border rounded-lg w-full px-3 py-2.5 mt-1 text-base"
            value={username}
            onChange={e=>setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="block mb-5">
          <span className="text-sm font-medium">{t('password')}</span>
          <input
            type="password"
            className="border rounded-lg w-full px-3 py-2.5 mt-1 text-base"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button
          disabled={loading}
          className="bg-primary text-white px-4 py-2.5 rounded-lg w-full font-medium disabled:opacity-50"
        >
          {loading ? t('loading') : t('login')}
        </button>
      </form>
    </div>
  )
}
