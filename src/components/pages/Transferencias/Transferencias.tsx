import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import Button from '../../atoms/Button/Button';
import Input from '../../atoms/Input/Input';
import Modal from '../../atoms/Modal/Modal';
import Table from '../../atoms/Table/Table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Bodega {
  id: string;
  nombre: string;
  ciudad: string;
}

interface Producto {
  id: string;
  name: string;
  fraccionable?: boolean;
  cantidad_por_empaque?: number | null;
}

interface Transferencia {
  id: string;
  producto_id: string;
  bodega_origen_id: string;
  bodega_destino_id: string;
  cantidad: number;
  cantidad_fraccionada?: number | null;
  fecha: string;
  notas?: string;
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

const Form = styled.form`
  display: grid;
  gap: 1rem;
  max-width: 500px;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const fetchBodegas = async () => {
  const { data, error } = await supabase
    .from('bodegas')
    .select('*')
    .order('nombre');
  if (error) throw error;
  return data;
};

const fetchProductos = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
};

const fetchTransferencias = async () => {
  const { data, error } = await supabase
    .from('transferencias_bodega')
    .select('*, productos(name, fraccionable, cantidad_por_empaque), bodega_origen_id, bodega_destino_id')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data;
};

const updateInventarioBodega = async (bodega_id: string, producto_id: string, cantidad: number, cantidad_fraccionada: number | null = null, tipo: 'suma' | 'resta') => {
  const { data: inventario, error } = await supabase
    .from('inventario_bodega')
    .select('*')
    .eq('bodega_id', bodega_id)
    .eq('producto_id', producto_id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  let nuevaCantidad = (inventario?.cantidad || 0);
  let nuevaCantidadFraccionada = (inventario?.cantidad_fraccionada || 0);
  if (tipo === 'suma') {
    nuevaCantidad += cantidad;
    if (cantidad_fraccionada) nuevaCantidadFraccionada += cantidad_fraccionada;
  } else {
    if (nuevaCantidad < cantidad || (cantidad_fraccionada && nuevaCantidadFraccionada < cantidad_fraccionada)) {
      throw new Error('Stock insuficiente en la bodega de origen para transferir.');
    }
    nuevaCantidad -= cantidad;
    if (cantidad_fraccionada) nuevaCantidadFraccionada -= cantidad_fraccionada;
  }
  if (inventario) {
    const { error: updateError } = await supabase
      .from('inventario_bodega')
      .update({ cantidad: nuevaCantidad, cantidad_fraccionada: nuevaCantidadFraccionada })
      .eq('id', inventario.id);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from('inventario_bodega')
      .insert({ bodega_id, producto_id, cantidad: nuevaCantidad, cantidad_fraccionada: nuevaCantidadFraccionada });
    if (insertError) throw insertError;
  }
};

const createTransferencia = async (transferencia: Omit<Transferencia, 'id'>) => {
  const { data, error } = await supabase
    .from('transferencias_bodega')
    .insert(transferencia)
    .select()
    .single();
  if (error) throw error;
  // Restar de origen
  await updateInventarioBodega(
    transferencia.bodega_origen_id,
    transferencia.producto_id,
    transferencia.cantidad,
    transferencia.cantidad_fraccionada || null,
    'resta'
  );
  // Sumar a destino
  await updateInventarioBodega(
    transferencia.bodega_destino_id,
    transferencia.producto_id,
    transferencia.cantidad,
    transferencia.cantidad_fraccionada || null,
    'suma'
  );
  return data;
};

const Transferencias: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Transferencia>>({});
  const queryClient = useQueryClient();

  const { data: bodegas, isLoading: isLoadingBodegas } = useQuery({
    queryKey: ['bodegas'],
    queryFn: fetchBodegas,
  });

  const { data: productos, isLoading: isLoadingProductos } = useQuery({
    queryKey: ['productos'],
    queryFn: fetchProductos,
  });

  const { data: transferencias, isLoading: isLoadingTransferencias } = useQuery({
    queryKey: ['transferencias'],
    queryFn: fetchTransferencias,
  });

  const createMutation = useMutation({
    mutationFn: createTransferencia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      setIsModalOpen(false);
      setFormData({});
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData as Omit<Transferencia, 'id'>);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidad' || name === 'cantidad_fraccionada' ? Number(value) : value,
    }));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Transferencias entre Bodegas', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Producto',
        'Bodega Origen',
        'Bodega Destino',
        'Cantidad',
        'Cantidad Fraccionada',
        'Fecha',
        'Notas',
      ]],
      body: (transferencias || []).map((row: any) => [
        row.productos?.name || '-',
        bodegas?.find((b: any) => b.id === row.bodega_origen_id)?.nombre || '-',
        bodegas?.find((b: any) => b.id === row.bodega_destino_id)?.nombre || '-',
        row.cantidad,
        row.productos?.fraccionable && row.cantidad_fraccionada ? row.cantidad_fraccionada : '-',
        row.fecha ? new Date(row.fecha).toLocaleDateString() : '-',
        row.notas || '-',
      ]),
    });
    doc.save('transferencias_bodega.pdf');
  };

  const columns = [
    {
      header: 'Producto',
      accessor: 'productos' as keyof Transferencia,
      render: (value: any) => value?.name || '-',
    },
    {
      header: 'Bodega Origen',
      accessor: 'bodega_origen_id' as keyof Transferencia,
      render: (value: string) => bodegas?.find((b: Bodega) => b.id === value)?.nombre || '-',
    },
    {
      header: 'Bodega Destino',
      accessor: 'bodega_destino_id' as keyof Transferencia,
      render: (value: string) => bodegas?.find((b: Bodega) => b.id === value)?.nombre || '-',
    },
    {
      header: 'Cantidad',
      accessor: 'cantidad' as keyof Transferencia,
    },
    {
      header: 'Cantidad Fraccionada',
      accessor: 'cantidad_fraccionada' as keyof Transferencia,
      render: (value: number, row: any) => row.productos?.fraccionable && value ? value : '-',
    },
    {
      header: 'Fecha',
      accessor: 'fecha' as keyof Transferencia,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      header: 'Notas',
      accessor: 'notas' as keyof Transferencia,
    },
  ];

  return (
    <PageContainer>
      <Header>
        <Title>Transferencias entre Bodegas</Title>
        <Button onClick={handleExportPDF} style={{ marginRight: '1rem' }}>
          Exportar a PDF
        </Button>
        <Button onClick={() => setIsModalOpen(true)}>
          Nueva Transferencia
        </Button>
      </Header>
      <Table columns={columns} data={transferencias || []} />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({});
        }}
        title="Nueva Transferencia"
      >
        <Form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="producto_id">Producto</label>
            <Select
              id="producto_id"
              name="producto_id"
              value={formData.producto_id || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione un producto</option>
              {productos?.map((p: Producto) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="bodega_origen_id">Bodega Origen</label>
            <Select
              id="bodega_origen_id"
              name="bodega_origen_id"
              value={formData.bodega_origen_id || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione una bodega</option>
              {bodegas?.map((b: Bodega) => (
                <option key={b.id} value={b.id}>{b.nombre} ({b.ciudad})</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="bodega_destino_id">Bodega Destino</label>
            <Select
              id="bodega_destino_id"
              name="bodega_destino_id"
              value={formData.bodega_destino_id || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione una bodega</option>
              {bodegas?.map((b: Bodega) => (
                <option key={b.id} value={b.id}>{b.nombre} ({b.ciudad})</option>
              ))}
            </Select>
          </div>
          <Input
            label="Cantidad"
            name="cantidad"
            type="number"
            min="1"
            value={formData.cantidad || ''}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Cantidad Fraccionada"
            name="cantidad_fraccionada"
            type="number"
            min="0"
            value={formData.cantidad_fraccionada || ''}
            onChange={handleInputChange}
            disabled={(() => {
              const prod = productos?.find((p: Producto) => p.id === formData.producto_id);
              return !prod?.fraccionable;
            })()}
          />
          <Input
            label="Fecha"
            name="fecha"
            type="date"
            value={formData.fecha || new Date().toISOString().split('T')[0]}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Notas"
            name="notas"
            value={formData.notas || ''}
            onChange={handleInputChange}
          />
          <Button type="submit" fullWidth>
            Registrar Transferencia
          </Button>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default Transferencias; 