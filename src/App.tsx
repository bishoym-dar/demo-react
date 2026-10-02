import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Toolbox from './pages/Toolbox'
import Focus from './pages/Focus'

function App() {
  return (
    <HashRouter>
      <nav className="site-nav" aria-label="Main">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/toolbox">Toolbox</NavLink>
        <NavLink to="/focus">Focus</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/toolbox" element={<Toolbox />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}

export default App
