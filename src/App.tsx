import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Toolbox from './pages/Toolbox'

function App() {
  return (
    <HashRouter>
      <nav className="site-nav" aria-label="Main">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/toolbox">Toolbox</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/toolbox" element={<Toolbox />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}

export default App
