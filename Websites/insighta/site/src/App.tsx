import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import StickyContact from './components/StickyContact'
import Home from './pages/Home'
import Nosotros from './pages/Nosotros'
import Servicios from './pages/Servicios'
import Contacto from './pages/Contacto'
import Blog from './pages/Blog'
import SeoGeo from './pages/servicios/SeoGeo'
import AutomatizacionIA from './pages/servicios/AutomatizacionIA'
import DisenoWeb from './pages/servicios/DisenoWeb'
import PerformanceMarketing from './pages/servicios/PerformanceMarketing'
import BlogPost from './pages/BlogPost'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <StickyContact />
      <Routes>
        {/* Páginas principales */}
        <Route path="/"          element={<Home />} />
        <Route path="/nosotros"  element={<Nosotros />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/contacto"  element={<Contacto />} />
        <Route path="/blog"          element={<Blog />} />
        <Route path="/blog/:slug"    element={<BlogPost />} />

        {/* Páginas individuales de servicio — silo /servicios/* */}
        <Route path="/servicios/posicionamiento-seo-geo"  element={<SeoGeo />} />
        <Route path="/servicios/automatizacion-ia"        element={<AutomatizacionIA />} />
        <Route path="/servicios/diseno-desarrollo-web"    element={<DisenoWeb />} />
        <Route path="/servicios/performance-marketing"    element={<PerformanceMarketing />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
