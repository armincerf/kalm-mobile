import PropTypes from 'prop-types'
import React from 'react'
import { Input, FormControl } from 'native-base'

export const TextInput: any = React.forwardRef((props: any, forwardedRef) => {
  const { label, error, ...textInputProps } = props
  const isError = Boolean(error)

  return (
    <FormControl>
      {Boolean(label) && <FormControl.Label my={2}>{label}</FormControl.Label>}
      <Input size="2xl" isError={isError} {...textInputProps} ref={forwardedRef} />
      {isError && <FormControl.ErrorMessage>{error}</FormControl.ErrorMessage>}
    </FormControl>
  )
})
