import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import StickyHeader from './components/StickyHeader';
import Home from './pages/Home';
import Topic from './pages/Topic';

const App: React.FC = () => {
    return (
        <Router basename="/outline">
            <a className="skip-link" href="#content">
                跳到主要內容
            </a>
            <StickyHeader />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/t/:topic" element={<Topic />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
};

export default App;
