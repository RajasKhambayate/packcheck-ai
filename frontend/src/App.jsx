import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ScanProduct from './pages/ScanProduct.jsx'
import ProductHistory from './pages/ProductHistory.jsx'
import ReportDetail from './pages/ReportDetail.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><ScanProduct /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductHistory /></ProtectedRoute>} />
      <Route path="/products/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
      <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  )
}
