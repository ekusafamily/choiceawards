import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import NomineeProfile from './pages/NomineeProfile';
import Nominate from './pages/Nominate';
import Results from './pages/Results';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:slug" element={<CategoryDetail />} />
          <Route path="/nominees/:id" element={<NomineeProfile />} />
          <Route path="/nominate" element={<Nominate />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
