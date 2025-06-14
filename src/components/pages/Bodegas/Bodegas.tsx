import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import Button from '../../atoms/Button/Button';
import Input from '../../atoms/Input/Input';
import Modal from '../../atoms/Modal/Modal';
import Table from '../../atoms/Table/Table';

interface Bodega {
  id: string;
  nombre: string;
  tipo: 'blanca' | 'oscura';
  ciudad: string;
  direccion: string;
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

const createBodega = async (bodega: Omit<Bodega, 'id'>) => {
  const { data, error } = await supabase
    .from('bodegas')
    .insert(bodega)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const updateBodega = async (bodega: Bodega) => {
  const { data, error } = await supabase
    .from('bodegas')
    .update(bodega)
    .eq('id', bodega.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const deleteBodega = async (id: string) => {
  const { error } = await supabase
    .from('bodegas')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

const ciudades = ['Quito', 'Guayaquil', 'Otra'];

const Bodegas: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null);
  const [formData, setFormData] = useState<Partial<Bodega>>({});
  const queryClient = useQueryClient();

  const { data: bodegas, isLoading } = useQuery({
    queryKey: ['bodegas'],
    queryFn: fetchBodegas,
  });

  const createMutation = useMutation({
    mutationFn: createBodega,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodegas'] });
      setIsModalOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBodega,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodegas'] });
      setIsModalOpen(false);
      setSelectedBodega(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBodega,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodegas'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBodega) {
      updateMutation.mutate({ ...formData, id: selectedBodega.id } as Bodega);
    } else {
      createMutation.mutate(formData as Omit<Bodega, 'id'>);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (bodega: Bodega) => {
    setSelectedBodega(bodega);
    setFormData(bodega);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta bodega?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre' as keyof Bodega },
    { header: 'Tipo', accessor: 'tipo' as keyof Bodega },
    { header: 'Ciudad', accessor: 'ciudad' as keyof Bodega },
    { header: 'Dirección', accessor: 'direccion' as keyof Bodega },
    {
      header: 'Acciones',
      accessor: 'id' as keyof Bodega,
      render: (value: string) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="small" onClick={() => handleEdit(bodegas?.find(b => b.id === value)!)}>
            Editar
          </Button>
          <Button size="small" variant="danger" onClick={() => handleDelete(value)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <div>Cargando...</div>;

  return (
    <PageContainer>
      <Header>
        <Title>Bodegas</Title>
        <Button onClick={() => {
          setSelectedBodega(null);
          setFormData({});
          setIsModalOpen(true);
        }}>
          Nueva Bodega
        </Button>
      </Header>

      <Table
        columns={columns}
        data={bodegas || []}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBodega(null);
          setFormData({});
        }}
        title={selectedBodega ? 'Editar Bodega' : 'Nueva Bodega'}
      >
        <Form onSubmit={handleSubmit}>
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre || ''}
            onChange={handleInputChange}
            required
          />
          <div>
            <label htmlFor="tipo">Tipo</label>
            <Select
              id="tipo"
              name="tipo"
              value={formData.tipo || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione un tipo</option>
              <option value="blanca">Blanca</option>
              <option value="oscura">Oscura</option>
            </Select>
          </div>
          <div>
            <label htmlFor="ciudad">Ciudad</label>
            <Select
              id="ciudad"
              name="ciudad"
              value={formData.ciudad || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione una ciudad</option>
              {ciudades.map(ciudad => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
            </Select>
          </div>
          <Input
            label="Dirección"
            name="direccion"
            value={formData.direccion || ''}
            onChange={handleInputChange}
            required
          />
          <Button type="submit" fullWidth>
            {selectedBodega ? 'Guardar Cambios' : 'Crear Bodega'}
          </Button>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default Bodegas; 