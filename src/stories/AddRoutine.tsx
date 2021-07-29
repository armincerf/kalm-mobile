import React, { useCallback, useRef, useState } from "react";
import {
  FormProvider,
  useForm,
  useFieldArray,
  useFormContext,
  useController,
  Controller,
} from "react-hook-form";
import {
  Button,
  View,
  Switch,
  FormControl,
  Pressable,
  HStack,
  Image,
} from "native-base";
import { FormTextInput } from "./FormTextInput";
import { FormDurationInput } from "./FormDurationInput";

const AddRoutine = ({ field, index, ...props }) => {
  //apparently you can't dynamically require things :/
  const kalmFace = require(`../../assets/images/kalm.png`);
  const panikFace = require(`../../assets/images/panik.png`);
  const extraPanikFace = require(`../../assets/images/extraPanik.png`);

  const descriptionRef = useRef<any>(null);
  const [hasDuration, setHasDuration] = useState(false);
  const focusDescription = useCallback(
    () => descriptionRef?.current?.focus(),
    [descriptionRef]
  );
  const feelingName = `routines.${index}.feeling`;
  const durationName = `routines.${index}.duration`;
  const FeelingButton = ({ feel, field, src }) => {
    const isSelected = feel === field.value;
    return (
      <Pressable
        borderRadius={5}
        borderWidth={isSelected ? 2 : 0}
        onPress={() => {
          props.setValue(feelingName, feel);
        }}
      >
        <Image size={isSelected ? "lg" : "sm"} source={src} alt={feel} />
      </Pressable>
    );
  };

  return (
    <View key={field.id} width="90%">
      <FormTextInput
        {...props}
        autoFocus={true}
        name={`routines.${index}.name`}
        label="Name"
        rules={{ required: "Name is required!" }}
        onSubmitEditing={focusDescription}
        returnKeyType="next"
      />

      <FormTextInput
        {...props}
        name={`routines.${index}.description`}
        label="Description"
        ref={descriptionRef}
      />
      <FormControl.Label>Has duration?</FormControl.Label>
      <Switch
        colorScheme="emerald"
        isChecked={hasDuration}
        onToggle={() => {
          if (hasDuration) {
            props.setValue(durationName, false);
          }
          setHasDuration(!hasDuration);
        }}
      />
      {hasDuration && (
        <FormDurationInput
          {...props}
          name={durationName}
          label="Duration in seconds"
        />
      )}
      <FormControl.Label>
        How does doing this activity make you feel?
      </FormControl.Label>

      <Controller
        control={props.control}
        rules={{
          required: false,
        }}
        render={({ field }) => (
          <HStack>
            {[
              ["kalm", kalmFace],
              ["panik", panikFace],
              ["extraPanik", extraPanikFace],
            ].map(([feeling, src]) => (
              <FeelingButton
                feel={feeling}
                key={feeling}
                field={field}
                src={src}
              />
            ))}
          </HStack>
        )}
        name={feelingName}
        defaultValue=""
      />
    </View>
  );
};

export default AddRoutine;
