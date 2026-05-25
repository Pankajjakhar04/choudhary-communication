import React, { createContext, useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

function parseJwt(token){
  try{
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')))
    return decoded
  }catch(e){ return null }
}

export function AuthProvider({ children }){
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'))
  const timerRef = useRef(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const logout = useCallback(()=>{
    localStorage.removeItem('adminToken')
    setToken(null)
    clearTimer()
    navigate('/admin/login')
  }, [navigate, clearTimer])

  const scheduleLogout = useCallback((jwtToken) => {
    clearTimer()
    if (!jwtToken) return
    const payload = parseJwt(jwtToken)
    if (payload && payload.exp){
      const ms = payload.exp * 1000 - Date.now()
      if (ms <= 0) { logout(); return }
      timerRef.current = setTimeout(()=>{ logout() }, ms)
    }
  }, [clearTimer, logout])

  const login = useCallback((jwtToken)=>{
    localStorage.setItem('adminToken', jwtToken)
    setToken(jwtToken)
    scheduleLogout(jwtToken)
  }, [scheduleLogout])

  useEffect(()=>{
    if (token) scheduleLogout(token)
    return () => { clearTimer() }
  }, [token, scheduleLogout, clearTimer])

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
}

export default AuthContext
