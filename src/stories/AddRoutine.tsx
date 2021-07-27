import React, { useCallback, useRef } from "react";
import {
  FormProvider,
  useForm,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { Button, View } from "native-base";
import { FormTextInput } from "./FormTextInput";
import { FormDurationInput } from "./FormDurationInput";

const AddRoutine = ({ field, index, ...props }) => {
  const descriptionRef = useRef<any>(null);
  const focusDescription = useCallback(
    () => descriptionRef?.current?.focus(),
    [descriptionRef]
  );
  const isFirst = index === 0;
  console.log("add", field);
  return (
    <View key={field.id} width="90%">
      {isFirst ? (
        <FormTextInput
          {...props}
          name={`routines.${index}.name`}
          label="Name"
          ref={props.firstRef}
          rules={{ required: "Name is required!" }}
          onSubmitEditing={focusDescription}
          returnKeyType="next"
        />
      ) : (
        <FormTextInput
          {...props}
          name={`routines.${index}.name`}
          label="Name"
          rules={{ required: "Name is required!" }}
          onSubmitEditing={focusDescription}
          returnKeyType="next"
        />
      )}

      <FormTextInput
        {...props}
        name={`routines.${index}.description`}
        label="Description"
        ref={descriptionRef}
      />
      <FormDurationInput
        {...props}
        name={`routines.${index}.duration`}
        label="Duration in seconds"
      />
    </View>
  );
};

export default AddRoutine;
