import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import NomineeProfile from './pages/NomineeProfile';
import Nominate from './pages/Nominate';
import Results from './pages/Results';
import Admin from './pages/Admin';
import TopNominees from './pages/TopNominees';
import SuccessfulNominations from './pages/SuccessfulNominations';
import CountdownStickyFooter from './components/CountdownStickyFooter';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:slug" element={<CategoryDetail />} />
          <Route path="/nominees/:id" element={<NomineeProfile />} />
          <Route path="/nominate" element={<Nominate />} />
          <Route path="/nominees" element={<TopNominees />} />
          <Route path="/successful-nominations" element={<SuccessfulNominations />} />
          <Route path="/results" element={<SuccessfulNominations />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
      <CountdownStickyFooter />
    </BrowserRouter>
  );
}
