import React, { useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import AuthContext, { AuthProvider } from './context/AuthContext'
import CustomerHome from './pages/CustomerHome'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedRoute({ children }){
  const { token } = useContext(AuthContext)
  if (!token) return <Navigate to="/admin/login" />
  return children
}

export default function App(){
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<CustomerHome/>} />
            <Route path="/admin/login" element={<AdminLogin/>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard/></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
