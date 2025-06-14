import { FC, InputHTMLAttributes, forwardRef } from 'react';
import styled, { css } from 'styled-components';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  fullWidth?: boolean;
}

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.875rem;
  font-weight: 500;
`;

const StyledInput = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.hasError ? '#dc3545' : '#ddd'};
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#dc3545' : '#007bff'};
    box-shadow: 0 0 0 2px ${props => props.hasError ? 'rgba(220, 53, 69, 0.25)' : 'rgba(0, 123, 255, 0.25)'};
  }

  &:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.span`
  display: block;
  color: #dc3545;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, fullWidth, ...props }, ref) => {
    return (
      <InputContainer fullWidth={fullWidth}>
        {label && <Label>{label}</Label>}
        <StyledInput ref={ref} hasError={!!error} {...props} />
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </InputContainer>
    );
  }
);

Input.displayName = 'Input';

export default Input; 