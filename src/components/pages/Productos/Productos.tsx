import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { Product, Category } from '../../../types';
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

const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        name
      )
    `)
    .order('name');

  if (error) throw error;
  return data;
};

const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateProduct = async (product: Partial<Product> & { id: string }) => {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', product.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

const Productos: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const queryClient = useQueryClient();

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setSelectedProduct(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      updateMutation.mutate({ ...formData, id: selectedProduct.id });
    } else {
      createMutation.mutate(formData as Omit<Product, 'id' | 'created_at' | 'updated_at'>);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Productos', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Nombre',
        'Descripción',
        'Categoría',
        'Precio',
        'Stock',
        'Fraccionable',
        'Cant. por Empaque',
      ]],
      body: (products || []).map((row: any) => [
        row.name,
        row.description,
        row.categories?.name || '-',
        `$${row.price?.toFixed(2)}`,
        row.stock,
        row.fraccionable ? 'Sí' : 'No',
        row.cantidad_por_empaque || '-',
      ]),
    });
    doc.save('productos.pdf');
  };

  const columns = [
    { header: 'Nombre', accessor: 'name' as keyof Product },
    { header: 'Descripción', accessor: 'description' as keyof Product },
    {
      header: 'Categoría',
      accessor: 'categories' as keyof Product,
      render: (value: any) => value?.name || 'Sin categoría',
    },
    {
      header: 'Precio',
      accessor: 'price' as keyof Product,
      render: (value: number) => `$${value.toFixed(2)}`,
    },
    {
      header: 'Stock',
      accessor: 'stock' as keyof Product,
    },
    {
      header: 'Fraccionable',
      accessor: 'fraccionable' as keyof Product,
      render: (value: boolean) => value ? 'Sí' : 'No',
    },
    {
      header: 'Cant. por Empaque',
      accessor: 'cantidad_por_empaque' as keyof Product,
      render: (value: number) => value || '-',
    },
    {
      header: 'Acciones',
      accessor: 'id' as keyof Product,
      render: (value: string) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="small" onClick={() => handleEdit(products?.find(p => p.id === value)!)}>
            Editar
          </Button>
          <Button size="small" variant="danger" onClick={() => handleDelete(value)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  if (isLoadingProducts || isLoadingCategories) return <div>Cargando...</div>;

  return (
    <PageContainer>
      <Header>
        <Title>Productos</Title>
        <Button onClick={handleExportPDF} style={{ marginLeft: '1rem' }}>
          Exportar a PDF
        </Button>
        <Button onClick={() => {
          setSelectedProduct(null);
          setFormData({});
          setIsModalOpen(true);
        }}>
          Nuevo Producto
        </Button>
      </Header>

      <Table
        columns={columns}
        data={products || []}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
          setFormData({});
        }}
        title={selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
          <div>
            <label htmlFor="category_id">Categoría</label>
            <Select
              id="category_id"
              name="category_id"
              value={formData.category_id || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione una categoría</option>
              {categories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Precio"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price || ''}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Stock"
            name="stock"
            type="number"
            min="0"
            value={formData.stock || ''}
            onChange={handleInputChange}
            required
          />
          <div>
            <label>
              <input
                type="checkbox"
                name="fraccionable"
                checked={!!formData.fraccionable}
                onChange={e => setFormData(prev => ({ ...prev, fraccionable: e.target.checked }))}
              />
              {' '}Fraccionable
            </label>
          </div>
          {formData.fraccionable && (
            <Input
              label="Cantidad por Empaque"
              name="cantidad_por_empaque"
              type="number"
              min="1"
              value={formData.cantidad_por_empaque || ''}
              onChange={handleInputChange}
              required
            />
          )}
          <Button type="submit" fullWidth>
            {selectedProduct ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default Productos; 