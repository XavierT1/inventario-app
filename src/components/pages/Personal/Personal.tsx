import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { Employee } from '../../../types';
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

const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateEmployee = async (employee: Partial<Employee> & { id: string }) => {
  const { data, error } = await supabase
    .from('employees')
    .update(employee)
    .eq('id', employee.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteEmployee = async (id: string) => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

const departments = [
  'Administración',
  'Ventas',
  'Almacén',
  'Contabilidad',
  'Recursos Humanos',
];

const positions = [
  'Gerente',
  'Supervisor',
  'Operador',
  'Asistente',
  'Analista',
];

const Personal: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsModalOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsModalOpen(false);
      setSelectedEmployee(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployee) {
      updateMutation.mutate({ ...formData, id: selectedEmployee.id });
    } else {
      createMutation.mutate(formData as Omit<Employee, 'id' | 'created_at' | 'updated_at'>);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Personal', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Nombre',
        'Email',
        'Cargo',
        'Departamento',
      ]],
      body: (employees || []).map((row: any) => [
        row.name,
        row.email,
        row.position,
        row.department,
      ]),
    });
    doc.save('personal.pdf');
  };

  const columns = [
    { header: 'Nombre', accessor: 'name' as keyof Employee },
    { header: 'Email', accessor: 'email' as keyof Employee },
    { header: 'Cargo', accessor: 'position' as keyof Employee },
    { header: 'Departamento', accessor: 'department' as keyof Employee },
    {
      header: 'Acciones',
      accessor: 'id' as keyof Employee,
      render: (value: string) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="small" onClick={() => handleEdit(employees?.find(e => e.id === value)!)}>
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
        <Title>Personal</Title>
        <Button onClick={handleExportPDF} style={{ marginLeft: '1rem' }}>
          Exportar a PDF
        </Button>
        <Button onClick={() => {
          setSelectedEmployee(null);
          setFormData({});
          setIsModalOpen(true);
        }}>
          Nuevo Empleado
        </Button>
      </Header>

      <Table
        columns={columns}
        data={employees || []}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
          setFormData({});
        }}
        title={selectedEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
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
            label="Email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            required
          />
          <div>
            <label htmlFor="position">Cargo</label>
            <Select
              id="position"
              name="position"
              value={formData.position || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione un cargo</option>
              {positions.map(position => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="department">Departamento</label>
            <Select
              id="department"
              name="department"
              value={formData.department || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione un departamento</option>
              {departments.map(department => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" fullWidth>
            {selectedEmployee ? 'Guardar Cambios' : 'Crear Empleado'}
          </Button>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default Personal; 