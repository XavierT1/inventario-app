import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { Category } from '../../../types';
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

const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

const createCategory = async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateCategory = async (category: Partial<Category> & { id: string }) => {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', category.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteCategory = async (id: string) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

const Categorias: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({});
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      setSelectedCategory(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      updateMutation.mutate({ ...formData, id: selectedCategory.id });
    } else {
      createMutation.mutate(formData as Omit<Category, 'id' | 'created_at' | 'updated_at'>);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData(category);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Categorías', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Nombre',
        'Descripción',
      ]],
      body: (categories || []).map((row: any) => [
        row.name,
        row.description,
      ]),
    });
    doc.save('categorias.pdf');
  };

  const columns = [
    { header: 'Nombre', accessor: 'name' as keyof Category },
    { header: 'Descripción', accessor: 'description' as keyof Category },
    {
      header: 'Acciones',
      accessor: 'id' as keyof Category,
      render: (value: string) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="small" onClick={() => handleEdit(categories?.find(c => c.id === value)!)}>
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
        <Title>Categorías</Title>
        <Button onClick={handleExportPDF} style={{ marginLeft: '1rem' }}>
          Exportar a PDF
        </Button>
        <Button onClick={() => {
          setSelectedCategory(null);
          setFormData({});
          setIsModalOpen(true);
        }}>
          Nueva Categoría
        </Button>
      </Header>

      <Table
        columns={columns}
        data={categories || []}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
          setFormData({});
        }}
        title={selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <Form onSubmit={handleSubmit}>
          <Input
            label="Nombre"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Descripción"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            required
          />
          <Button type="submit" fullWidth>
            {selectedCategory ? 'Guardar Cambios' : 'Crear Categoría'}
          </Button>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default Categorias; 