import PropTypes from 'prop-types'
import React from 'react'
import { Input, FormControl, TextArea } from 'native-base'

export const TextInput: any = React.forwardRef((props: any, forwardedRef) => {
  const { label, error, textArea, ...textInputProps } = props
  const isError = Boolean(error)

  return (
    <FormControl>
      {Boolean(label) && <FormControl.Label my={2}>{label}</FormControl.Label>}
      {Boolean(textArea) ? (
        <TextArea {...textInputProps} ref={forwardedRef} />
      ) : (
        <Input
          size="lg"
          isError={isError}
          {...textInputProps}
          ref={forwardedRef}
        />
      )}

      {isError && <FormControl.ErrorMessage>{error}</FormControl.ErrorMessage>}
    </FormControl>
  )
})
