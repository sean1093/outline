import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StickyHeader from './components/StickyHeader';
import Home from './pages/Home';
import Topic from './pages/Topic';

const App: React.FC = () => {
    return (
        <Router basename="/outline">
            <StickyHeader />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/t/:topic" element={<Topic />} />
            </Routes>
        </Router>
    );
};

export default App;
