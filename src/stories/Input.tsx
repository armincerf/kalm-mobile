import PropTypes from 'prop-types'
import React from 'react'
import { Input, FormControl } from 'native-base'

export const TextInput: any = React.forwardRef((props: any, forwardedRef) => {
  const { label, error, ...textInputProps } = props
  const isError = Boolean(error)

  return (
    <FormControl>
      {Boolean(label) && <FormControl.Label>{label}</FormControl.Label>}
      <Input bg="#e5ecf2" isError={isError} {...textInputProps} ref={forwardedRef} />
      {isError && <FormControl.ErrorMessage>{error}</FormControl.ErrorMessage>}
    </FormControl>
  )
})
