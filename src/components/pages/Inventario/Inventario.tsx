import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import Table from '../../atoms/Table/Table';
import Select from '../../atoms/Input/Input';
import Button from '../../atoms/Button/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Bodega {
  id: string;
  nombre: string;
  tipo: string;
  ciudad: string;
  direccion: string;
}

interface InventarioBodega {
  id: string;
  producto_id: string;
  bodega_id: string;
  cantidad: number;
  cantidad_fraccionada: number | null;
  productos: {
    name: string;
    fraccionable?: boolean;
    cantidad_por_empaque?: number | null;
  };
}

const PageContainer = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  color: #333;
  margin: 0;
`;

const fetchBodegas = async () => {
  const { data, error } = await supabase
    .from('bodegas')
    .select('*')
    .order('nombre');
  if (error) throw error;
  return data;
};

const fetchInventario = async (bodegaId: string) => {
  const { data, error } = await supabase
    .from('inventario_bodega')
    .select('*, productos(name, fraccionable, cantidad_por_empaque)')
    .eq('bodega_id', bodegaId);
  if (error) throw error;
  return data;
};

const Inventario: FC = () => {
  const [bodegaId, setBodegaId] = useState<string>('');

  const { data: bodegas, isLoading: isLoadingBodegas } = useQuery({
    queryKey: ['bodegas'],
    queryFn: fetchBodegas,
  });

  const { data: inventario, isLoading: isLoadingInventario } = useQuery({
    queryKey: ['inventario', bodegaId],
    queryFn: () => bodegaId ? fetchInventario(bodegaId) : Promise.resolve([]),
    enabled: !!bodegaId,
  });

  const columns = [
    {
      header: 'Producto',
      accessor: 'productos' as keyof InventarioBodega,
      render: (value: any) => value?.name || '-',
    },
    {
      header: 'Fraccionable',
      accessor: 'productos' as keyof InventarioBodega,
      render: (value: any) => value?.fraccionable ? 'Sí' : 'No',
    },
    {
      header: 'Cantidad',
      accessor: 'cantidad' as keyof InventarioBodega,
    },
    {
      header: 'Cantidad Fraccionada',
      accessor: 'cantidad_fraccionada' as keyof InventarioBodega,
      render: (_value, row) =>
        row.productos?.fraccionable && row.cantidad_fraccionada ? String(row.cantidad_fraccionada) : '-',
    },
    {
      header: 'Cant. por Empaque',
      accessor: 'productos' as keyof InventarioBodega,
      render: (value: any) => value?.cantidad_por_empaque || '-',
    },
  ];

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Inventario por Bodega', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Producto',
        'Fraccionable',
        'Cantidad',
        'Cantidad Fraccionada',
        'Cant. por Empaque',
      ]],
      body: (inventario || []).map((row: any) => [
        row.productos?.name || '-',
        row.productos?.fraccionable ? 'Sí' : 'No',
        row.cantidad,
        row.productos?.fraccionable && row.cantidad_fraccionada ? row.cantidad_fraccionada : '-',
        row.productos?.cantidad_por_empaque || '-',
      ]),
    });
    doc.save('inventario_bodega.pdf');
  };

  return (
    <PageContainer>
      <Header>
        <Title>Inventario por Bodega</Title>
        <div>
          <label htmlFor="bodega">Bodega: </label>
          <select
            id="bodega"
            value={bodegaId}
            onChange={e => setBodegaId(e.target.value)}
          >
            <option value="">Seleccione una bodega</option>
            {bodegas?.map((b: Bodega) => (
              <option key={b.id} value={b.id}>{b.nombre} ({b.ciudad})</option>
            ))}
          </select>
        </div>
        <Button onClick={handleExportPDF} style={{ marginLeft: '1rem' }}>
          Exportar a PDF
        </Button>
      </Header>
      {isLoadingInventario ? (
        <div>Cargando inventario...</div>
      ) : (
        <Table columns={columns} data={inventario || []} />
      )}
    </PageContainer>
  );
};

export default Inventario; 