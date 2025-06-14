import { FC, useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { Company } from '../../../types';
import Button from '../../atoms/Button/Button';
import Input from '../../atoms/Input/Input';
import Modal from '../../atoms/Modal/Modal';
import Table from '../../atoms/Table/Table';

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

const fetchCompany = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

const updateCompany = async (company: Partial<Company>) => {
  const { data, error } = await supabase
    .from('companies')
    .update(company)
    .eq('id', company.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const Empresa: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({});
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: fetchCompany,
  });

  const updateMutation = useMutation({
    mutationFn: updateCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      setIsModalOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company?.id) {
      updateMutation.mutate({ ...formData, id: company.id });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const columns = [
    { header: 'Nombre', accessor: 'name' as keyof Company },
    { header: 'Dirección', accessor: 'address' as keyof Company },
    { header: 'Teléfono', accessor: 'phone' as keyof Company },
    { header: 'Email', accessor: 'email' as keyof Company },
    { header: 'RUC', accessor: 'tax_id' as keyof Company },
  ];

  if (isLoading) return <div>Cargando...</div>;

  return (
    <PageContainer>
      <Header>
        <Title>Información de la Empresa</Title>
        <Button onClick={() => setIsModalOpen(true)}>Editar</Button>
      </Header>

      {company && (
        <Table
          columns={columns}
          data={[company]}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editar Empresa"
      >
        <Form onSubmit={handleSubmit}>
          <Input
            label="Nombre"
            name="name"
            value={formData.name || company?.name || ''}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Dirección"
            name="address"
            value={formData.address || company?.address || ''}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Teléfono"
            name="phone"
            value={formData.phone || company?.phone || ''}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email || company?.email || ''}
            onChange={handleInputChange}
            required
          />
          <Input
            label="RUC"
            name="tax_id"
            value={formData.tax_id || company?.tax_id || ''}
            onChange={handleInputChange}
            required
          />
          <Button type="submit" fullWidth>
            Guardar Cambios
          </Button>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default Empresa; 