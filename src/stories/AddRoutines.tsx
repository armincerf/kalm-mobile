import React, { useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button, HStack, ScrollView, SmallCloseIcon } from "native-base";
import AddRoutine from "./AddRoutine";
import { FormTextInput } from "./FormTextInput";
import { Box, Center } from "native-base";

type FormValues = {
  routines: {
    name: string;
    description?: string;
    duration?: number;
  }[];
};

export default ({ handleSubmit }) => {
  const defaultRoutine = { name: "", description: "", duration: null };

  const formMethods = useForm<FormValues>({
    defaultValues: {
      routines: [defaultRoutine],
    },
  });

  const { control } = formMethods;
  const fieldArrayMethods = useFieldArray({
    control,
    name: "routines",
  });

  const { fields, append, remove } = fieldArrayMethods;
  console.log(fields);
  const onSubmit = (form) => {
    handleSubmit(form);
  };

  const onErrors = (errors) => {
    console.warn(errors);
  };

  const firstRef = useRef<any>(null);

  const focusFirst = useCallback(() => firstRef?.current?.focus(), [firstRef]);

  const appendRoutine = () => {
    append(defaultRoutine);
  };
  const removeRoutine = (idx) => {
    remove(idx);
  };

  return (
    <ScrollView m={4}>
      <FormTextInput
        {...formMethods}
        name="routineName"
        label="Routine Name"
        rules={{ required: "Routine Name is required!" }}
        onSubmitEditing={focusFirst}
        returnKeyType="next"
      />
      {fields.map((routine, idx) => (
        <HStack key={routine.name + idx}>
          <AddRoutine
            {...formMethods}
            firstRef={firstRef}
            field={routine}
            index={idx}
          />
          <Button
            size="xs"
            height={30}
            variant="outline"
            colorScheme="secondary"
            onPress={() => removeRoutine(idx)}
          >
            <SmallCloseIcon color="red" />
          </Button>
        </HStack>
      ))}
      <Button onPress={appendRoutine} m="2">
        Add step
      </Button>
      <Button onPress={formMethods.handleSubmit(onSubmit, onErrors)}>
        Submit
      </Button>
    </ScrollView>
  );
};
