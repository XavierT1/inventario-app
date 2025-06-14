import { FC } from 'react';
import styled from 'styled-components';

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

const TableHead = styled.thead`
  background-color: #f8f9fa;
`;

const TableRow = styled.tr<{ clickable?: boolean }>`
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.clickable ? '#f8f9fa' : 'transparent'};
  }
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  color: #212529;
`;

const TableBody = styled.tbody`
  tr:last-child td {
    border-bottom: none;
  }
`;

function Table<T extends { id: string | number }>({ columns, data, onRowClick }: TableProps<T>) {
  return (
    <TableContainer>
      <StyledTable>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableHeader key={index}>{column.header}</TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              clickable={!!onRowClick}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column, index) => (
                <TableCell key={index}>
                  {column.render
                    ? column.render(item[column.accessor], item)
                    : String(item[column.accessor])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
}

export default Table; 