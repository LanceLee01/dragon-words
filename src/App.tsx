import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-parchment">
        <Routes>
          <Route path="/" element={<div className="p-8 text-center text-2xl">Dragon Words</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
