import React, { useState, useEffect, lazy, Suspense, memo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Lazy-loaded components
const PublicBooks = lazy(() => import('./components/PublicBooks'));
const MainApp = lazy(() => import('./components/MainApp'));

function App() {
  return (
    <>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      }>
        <Routes>
          <Route path="/books" element={<PublicBooks />} />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" />
    </>
  );
}

export default App;