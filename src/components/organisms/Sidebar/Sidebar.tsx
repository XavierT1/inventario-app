import React, { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useStore } from '../../../store/useStore';

const SidebarContainer = styled.aside`
  width: 250px;
  height: 100vh;
  background-color: #1a1a1a;
  color: white;
  padding: 1rem;
  position: fixed;
  left: 0;
  top: 0;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
`;

const NavItem = styled(Link)<{ active: boolean }>`
  display: block;
  padding: 0.75rem 1rem;
  color: ${props => props.active ? '#fff' : '#888'};
  text-decoration: none;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background-color: ${props => props.active ? '#333' : 'transparent'};
  transition: all 0.3s ease;

  &:hover {
    background-color: #333;
    color: #fff;
  }
`;

const LogoutButton = styled.button`
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  color: #fff;
  background: none;
  border: none;
  border-radius: 4px;
  margin-top: 1rem;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  transition: background-color 0.3s ease;
  &:hover {
    background-color: #333;
  }
`;

const Sidebar: FC = () => {
  const location = useLocation();
  const { logout } = useStore();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/empresa', label: 'Empresa' },
    { path: '/configuraciones', label: 'Configuraciones' },
    { path: '/bodegas', label: 'Bodegas' },
    { path: '/categorias', label: 'Categorías' },
    { path: '/productos', label: 'Productos' },
    { path: '/personal', label: 'Personal' },
    { path: '/kardex', label: 'Kardex' },
    { path: '/transferencias', label: 'Transferencias' },
    { path: '/reportes', label: 'Reportes' },
  ];

  return (
    <SidebarContainer>
      <Logo>Inventario App</Logo>
      <nav>
        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            active={location.pathname === item.path}
          >
            {item.label}
          </NavItem>
        ))}
        <LogoutButton onClick={logout}>
          Cerrar Sesión
        </LogoutButton>
      </nav>
    </SidebarContainer>
  );
};

export default Sidebar; 