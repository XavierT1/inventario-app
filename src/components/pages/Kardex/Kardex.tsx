import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { InventoryMovement, Product, Employee } from '../../../types';
import Button from '../../atoms/Button/Button';
import Input from '../../atoms/Input/Input';
import Modal from '../../atoms/Modal/Modal';
import Table from '../../atoms/Table/Table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const fetchMovements = async (bodegaId?: string) => {
  let query = supabase
    .from('inventory_movements')
    .select(`
      *,
      products (
        name, fraccionable
      ),
      employees (
        name
      ),
      bodegas (
        nombre
      )
    `)
    .order('date', { ascending: false });
  if (bodegaId) query = query.eq('bodega_id', bodegaId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

const updateInventarioBodega = async (bodega_id: string, product_id: string, type: 'entrada' | 'salida', cantidad: number, cantidad_fraccionada: number | null = null) => {
  // Buscar inventario actual
  const { data: inventario, error } = await supabase
    .from('inventario_bodega')
    .select('*')
    .eq('bodega_id', bodega_id)
    .eq('producto_id', product_id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  let nuevaCantidad = (inventario?.cantidad || 0);
  let nuevaCantidadFraccionada = (inventario?.cantidad_fraccionada || 0);
  if (type === 'entrada') {
    nuevaCantidad += cantidad;
    if (cantidad_fraccionada) nuevaCantidadFraccionada += cantidad_fraccionada;
  } else {
    // Validar stock suficiente
    if (nuevaCantidad < cantidad || (cantidad_fraccionada && nuevaCantidadFraccionada < cantidad_fraccionada)) {
      throw new Error('Stock insuficiente en la bodega para realizar la salida.');
    }
    nuevaCantidad -= cantidad;
    if (cantidad_fraccionada) nuevaCantidadFraccionada -= cantidad_fraccionada;
  }
  if (inventario) {
    // Actualizar
    const { error: updateError } = await supabase
      .from('inventario_bodega')
      .update({ cantidad: nuevaCantidad, cantidad_fraccionada: nuevaCantidadFraccionada })
      .eq('id', inventario.id);
    if (updateError) throw updateError;
  } else {
    // Crear
    const { error: insertError } = await supabase
      .from('inventario_bodega')
      .insert({ bodega_id, producto_id: product_id, cantidad: nuevaCantidad, cantidad_fraccionada: nuevaCantidadFraccionada });
    if (insertError) throw insertError;
  }
};

const createMovement = async (movement: Omit<InventoryMovement, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert(movement)
    .select()
    .single();
  if (error) throw error;
  // Actualizar inventario_bodega
  await updateInventarioBodega(
    movement.bodega_id!,
    movement.product_id,
    movement.type,
    movement.quantity,
    movement.cantidad_fraccionada || null
  );
  return data;
};

const Kardex: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InventoryMovement>>({});
  const [bodegaId, setBodegaId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: bodegas, isLoading: isLoadingBodegas } = useQuery({
    queryKey: ['bodegas'],
    queryFn: fetchBodegas,
  });

  const { data: movements, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['movements', bodegaId],
    queryFn: () => fetchMovements(bodegaId),
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  const createMutation = useMutation({
    mutationFn: createMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      setIsModalOpen(false);
      setFormData({});
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData as Omit<InventoryMovement, 'id' | 'created_at'>);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'cantidad_fraccionada' ? Number(value) : value,
    }));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Movimientos del Kardex', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Bodega',
        'Producto',
        'Tipo',
        'Cantidad',
        'Cantidad Fraccionada',
        'Fecha',
        'Empleado',
        'Notas',
      ]],
      body: (movements || []).map((row: any) => [
        row.bodegas?.nombre || '-',
        row.products?.name || '-',
        row.type === 'entrada' ? 'Entrada' : 'Salida',
        row.quantity,
        row.products?.fraccionable && row.cantidad_fraccionada ? row.cantidad_fraccionada : '-',
        row.date ? new Date(row.date).toLocaleDateString() : '-',
        row.employees?.name || '-',
        row.notes || '-',
      ]),
    });
    doc.save('kardex.pdf');
  };

  const columns = [
    {
      header: 'Bodega',
      accessor: 'bodegas' as keyof InventoryMovement,
      render: (value: any) => value?.nombre || '-',
    },
    {
      header: 'Producto',
      accessor: 'products' as keyof InventoryMovement,
      render: (value: any) => value?.name || 'N/A',
    },
    {
      header: 'Tipo',
      accessor: 'type' as keyof InventoryMovement,
      render: (value: string) => value === 'entrada' ? 'Entrada' : 'Salida',
    },
    {
      header: 'Cantidad',
      accessor: 'quantity' as keyof InventoryMovement,
    },
    {
      header: 'Cantidad Fraccionada',
      accessor: 'cantidad_fraccionada' as keyof InventoryMovement,
      render: (value: number, row: any) => row.products?.fraccionable && value ? value : '-',
    },
    {
      header: 'Fecha',
      accessor: 'date' as keyof InventoryMovement,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      header: 'Empleado',
      accessor: 'employees' as keyof InventoryMovement,
      render: (value: any) => value?.name || 'N/A',
    },
    {
      header: 'Notas',
      accessor: 'notes' as keyof InventoryMovement,
    },
  ];

  if (isLoadingMovements || isLoadingProducts || isLoadingEmployees || isLoadingBodegas) {
    return <div>Cargando...</div>;
  }

  return (
    <PageContainer>
      <Header>
        <Title>Kardex</Title>
        <div>
          <label htmlFor="bodega">Bodega: </label>
          <Select
            as="select"
            id="bodega"
            name="bodega_id"
            value={bodegaId}
            onChange={e => setBodegaId(e.target.value)}
            required
          >
            <option value="">Seleccione una bodega</option>
            {bodegas?.map((b: any) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </Select>
        </div>
        <Button onClick={handleExportPDF} style={{ marginLeft: '1rem' }}>
          Exportar a PDF
        </Button>
        <Button onClick={() => setIsModalOpen(true)}>
          Nuevo Movimiento
        </Button>
      </Header>
      <Table
        columns={columns}
        data={movements || []}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({});
        }}
        title="Nuevo Movimiento"
      >
        <Form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="bodega_id">Bodega</label>
            <Select
              as="select"
              id="bodega_id"
              name="bodega_id"
              value={formData.bodega_id || bodegaId}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione una bodega</option>
              {bodegas?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="product_id">Producto</label>
            <Select
              id="product_id"
              name="product_id"
              value={formData.product_id || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione un producto</option>
              {products?.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="type">Tipo de Movimiento</label>
            <Select
              id="type"
              name="type"
              value={formData.type || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione un tipo</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </Select>
          </div>
          <Input
            label="Cantidad"
            name="quantity"
            type="number"
            min="1"
            value={formData.quantity || ''}
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
              const prod = products?.find((p: any) => p.id === formData.product_id);
              return !prod?.fraccionable;
            })()}
          />
          <Input
            label="Fecha"
            name="date"
            type="date"
            value={formData.date || new Date().toISOString().split('T')[0]}
            onChange={handleInputChange}
            required
          />
          <div>
            <label htmlFor="employee_id">Empleado</label>
            <Select
              id="employee_id"
              name="employee_id"
              value={formData.employee_id || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione un empleado</option>
              {employees?.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Notas"
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
          />
          <Button type="submit" fullWidth>
            Registrar Movimiento
          </Button>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default Kardex; 