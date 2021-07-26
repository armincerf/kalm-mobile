import PropTypes from "prop-types";
import React from "react";
import { useController } from "react-hook-form";

import { DurationInput } from "./DurationInput";

const ControlledInput = (props: any) => {
  const {
    control,
    formState,
    setValue,
    name,
    rules,
    defaultValue = "",
    ...inputProps
  } = props;

  const { field } = useController({ name, control, rules, defaultValue });

  return (
    <DurationInput
      {...inputProps}
      name={name}
      onChange={(values) => {
        setValue(name, values);
      }}
    />
  );
};

export const FormDurationInput: any = (props: any) => {
  const { name, ...inputProps } = props;

  if (!name) {
    const errorMessage = 'Form field must have a "name" prop!';
    return <DurationInput {...inputProps} error={errorMessage} />;
  }

  return <ControlledInput {...props} />;
};

FormDurationInput.displayName = "FormInput";
ControlledInput.displayName = "ControlledInput";

FormDurationInput.propTypes = {
  name: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.any,
};

ControlledInput.propTypes = FormDurationInput.propTypes;
