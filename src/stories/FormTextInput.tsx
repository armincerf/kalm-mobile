import PropTypes from "prop-types";
import React, { useEffect } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "./Input";

const ControlledInput = React.forwardRef((props: any, forwardedRef) => {
  const {
    control,
    reset,
    formState: { errors },
    name,
    rules,
    defaultValue = "",
    ...inputProps
  } = props;
  const { field, fieldState } = useController({
    name,
    control,
    rules,
    defaultValue,
  });
  return (
    <TextInput
      {...inputProps}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      value={field.value}
      ref={forwardedRef}
    />
  );
});

export const FormTextInput: any = React.forwardRef(
  (props: any, forwardedRef) => {
    const { name, ...inputProps } = props;

    if (!name) {
      const errorMessage = 'Form field must have a "name" prop!';
      return <TextInput {...props} error={errorMessage} editable={false} />;
    }

    return <ControlledInput {...props} ref={forwardedRef} />;
  }
);

FormTextInput.displayName = "FormInput";
ControlledInput.displayName = "ControlledInput";

FormTextInput.propTypes = {
  name: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.any,
};

ControlledInput.propTypes = FormTextInput.propTypes;
