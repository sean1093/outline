import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import StickyHeader from './components/StickyHeader';
import Outline from './pages/Outline';
import Travel from './pages/Travel';
import Tech from './pages/Tech';
import Algorithm from './pages/Algorithm';

const App: React.FC = () => {
    return (
        <div style={{ height: '100vh' }}>
            <Router>
                <StickyHeader />
                <Routes>
                    <Route path="/" element={<Outline />} />
                    <Route path="/travel" element={<Travel />} />
                    <Route path="/tech" element={<Tech />} />
                    <Route path="/algorithm" element={<Algorithm />} />
                </Routes>
            </Router>
        </div>
    );
};

export default App;
