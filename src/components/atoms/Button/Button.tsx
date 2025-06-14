import { FC, ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const getVariantStyles = (variant: ButtonProps['variant']) => {
  switch (variant) {
    case 'secondary':
      return css`
        background-color: #6c757d;
        &:hover {
          background-color: #5a6268;
        }
      `;
    case 'danger':
      return css`
        background-color: #dc3545;
        &:hover {
          background-color: #c82333;
        }
      `;
    case 'success':
      return css`
        background-color: #28a745;
        &:hover {
          background-color: #218838;
        }
      `;
    default:
      return css`
        background-color: #007bff;
        &:hover {
          background-color: #0056b3;
        }
      `;
  }
};

const getSizeStyles = (size: ButtonProps['size']) => {
  switch (size) {
    case 'small':
      return css`
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
      `;
    case 'large':
      return css`
        padding: 0.75rem 1.5rem;
        font-size: 1.25rem;
      `;
    default:
      return css`
        padding: 0.5rem 1rem;
        font-size: 1rem;
      `;
  }
};

const StyledButton = styled.button<ButtonProps>`
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  width: ${props => props.fullWidth ? '100%' : 'auto'};

  ${props => getVariantStyles(props.variant)}
  ${props => getSizeStyles(props.size)}

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const Button: FC<ButtonProps> = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};

export default Button; 