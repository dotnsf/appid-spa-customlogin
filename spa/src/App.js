import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Main from './Main';

function App() {
  return (
    <>
    {/*
    <React.Fragment>
      <Routes>
        <Route path="/*" element={<Main />} />
      </Routes>
    </React.Fragment>
    */}
    <BrowserRouter>
      <Main />
    </BrowserRouter>
    </>
  );
}

export default App;
