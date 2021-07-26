import PropTypes from "prop-types";
import React from "react";
import { useController } from "react-hook-form";

import { Input } from "./Input";

const ControlledInput = React.forwardRef((props: any, forwardedRef) => {
  const { control, formState: { errors }, name, rules, defaultValue = "", ...inputProps } = props;
  const { field } = useController({ name, control, rules, defaultValue });

  return (
    <Input
      {...inputProps}
      error={errors[name]?.message}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      value={field.value}
      ref={forwardedRef}
    />
  );
});

export const FormTextInput: any = React.forwardRef((props: any, forwardedRef) => {
  const { name, ...inputProps } = props;

  if (!name) {
    const errorMessage = 'Form field must have a "name" prop!'
    return <Input {...props} error={errorMessage} editable={false} />;
  }

  return <ControlledInput {...props} ref={forwardedRef} />;
});

FormTextInput.displayName = "FormInput";
ControlledInput.displayName = "ControlledInput";

FormTextInput.propTypes = {
  name: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.any,
};

ControlledInput.propTypes = FormTextInput.propTypes;
