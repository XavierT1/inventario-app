import React, { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styled from 'styled-components';
import { useStore } from './store/useStore';
import Sidebar from './components/organisms/Sidebar/Sidebar';
import Login from './components/pages/Login/Login';
import Empresa from './components/pages/Empresa/Empresa';
import Categorias from './components/pages/Categorias/Categorias';
import Productos from './components/pages/Productos/Productos';
import Personal from './components/pages/Personal/Personal';
import Kardex from './components/pages/Kardex/Kardex';
import Bodegas from './components/pages/Bodegas/Bodegas';
import Transferencias from './components/pages/Transferencias/Transferencias';

const queryClient = new QueryClient();

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
`;

const PrivateRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: FC = () => {
  const { isAuthenticated } = useStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContainer>
          {isAuthenticated && <Sidebar />}
          <MainContent>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <div>Dashboard</div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/empresa"
                element={
                  <PrivateRoute>
                    <Empresa />
                  </PrivateRoute>
                }
              />
              <Route
                path="/configuraciones"
                element={
                  <PrivateRoute>
                    <div>Configuraciones</div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/categorias"
                element={
                  <PrivateRoute>
                    <Categorias />
                  </PrivateRoute>
                }
              />
              <Route
                path="/productos"
                element={
                  <PrivateRoute>
                    <Productos />
                  </PrivateRoute>
                }
              />
              <Route
                path="/personal"
                element={
                  <PrivateRoute>
                    <Personal />
                  </PrivateRoute>
                }
              />
              <Route
                path="/kardex"
                element={
                  <PrivateRoute>
                    <Kardex />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bodegas"
                element={
                  <PrivateRoute>
                    <Bodegas />
                  </PrivateRoute>
                }
              />
              <Route
                path="/transferencias"
                element={
                  <PrivateRoute>
                    <Transferencias />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reportes"
                element={
                  <PrivateRoute>
                    <div>Reportes</div>
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </MainContent>
        </AppContainer>
      </Router>
    </QueryClientProvider>
  );
};

export default App; 