import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components/native'
import { COLORS, Wrapper, Label, Error } from './constants'


const StyledInput = styled.TextInput`
  padding: 0.5em;
  margin: 0.5em;
  color: ${props => props.inputColor || COLORS.gray};
  background: white;
  border-color: ${(props) => (props.isError ? COLORS.red : COLORS.gray)};
  border-width: 1px;
  border-radius: 3px;
`;

export const Input: any = React.forwardRef((props: any, forwardedRef) => {
  const { label, error, ...textInputProps } = props
  const isError = Boolean(error)

  return (
    <Wrapper>
      {Boolean(label) && <Label>{label}</Label>}
      <StyledInput isError={isError} {...textInputProps} ref={forwardedRef} />
      {isError && <Error>{error}</Error>}
    </Wrapper>
  )
})

Input.displayName = 'Input'
Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
}