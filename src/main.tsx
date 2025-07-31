import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Gracias from './gracias'
import ErrorPage from './error'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/gracias" element={<Gracias />} />
        <Route path="/error"    element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
