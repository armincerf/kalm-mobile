import React, { useCallback, useRef } from "react";
import {
  useWatch,
  Controller,
} from "react-hook-form";
import {
  Center,
  View,
  Switch,
  FormControl,
  Pressable,
  HStack,
  Image,
} from "native-base";
import { FormTextInput } from "./FormTextInput";
import { FormDurationInput } from "./FormDurationInput";
import { vibrate } from "./utils";
import InputSpinner from "react-native-input-spinner";

const FeelingPicker = ({ setValue, field, feelingName }) => {
  console.log("render");

  //apparently you can't dynamically require things :/
  const kalmFace = require(`../../assets/images/kalm.png`);
  const panikFace = require(`../../assets/images/panik.png`);
  const extraPanikFace = require(`../../assets/images/extraPanik.png`);
  const FeelingButton = ({ feel, field, src }) => {
    const isSelected = feel === field.value;
    return (
      <Pressable
        borderRadius={5}
        borderWidth={isSelected ? 2 : 0}
        onPress={() => {
          if (feel === "kalm") {
            vibrate("weak");
          } else if (feel === "extraPanik") {
            vibrate("hard");
          } else {
            vibrate("medium");
          }
          setValue(feelingName, feel);
        }}
      >
        <Image size={isSelected ? "xl" : "lg"} source={src} alt={feel} />
      </Pressable>
    );
  };
  return (
    <HStack>
      {[
        ["kalm", kalmFace],
        ["panik", panikFace],
        ["extraPanik", extraPanikFace],
      ].map(([feeling, src]) => (
        <FeelingButton feel={feeling} key={feeling} field={field} src={src} />
      ))}
    </HStack>
  );
};

const AddRoutine = ({ field, index, ...props }) => {
  const descriptionRef = useRef<any>(null);
  const feelingName = `routines.${index}.feeling`;
  const focusDescription = useCallback(
    () => descriptionRef?.current?.focus(),
    [descriptionRef]
  );
  const durationName = `routines.${index}.duration`;

  const Toggle = ({ name, label, value }) => {
    return (
      <>
        <FormControl.Label>{label}</FormControl.Label>
        <Controller
          control={props.control}
          rules={{
            required: false,
          }}
          render={({ field }) => (
            <Switch
              colorScheme="emerald"
              isChecked={value}
              onToggle={() => {
                props.setValue(name, !value);
              }}
            />
          )}
          name={name}
          defaultValue={false}
        />
      </>
    );
  };
  const NumberPicker = ({ name, label }) => {
    return (
      <>
        <FormControl.Label>{label}</FormControl.Label>
        <Controller
          control={props.control}
          rules={{
            required: false,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <FormControl my={2}>
              <InputSpinner
                min={1}
                colorMin={"#40c5f4"} // use color theme?
                value={value}
                onBlur={onBlur}
                skin="modern"
                onChange={onChange}
              />
            </FormControl>
          )}
          name={name}
          defaultValue={field.value}
        />
      </>
    );
  };

  const { control } = props;
  const Selections = () => {
    const data = [
      ["hasNotification", "Send a notification when this activity starts?"],
      ["hasGif", "Generate a random gif for this activity?"],
      ["hasDuration", "Add a duration?"],
    ];
    const names: string[] = data.map((d) => `routines.${index}.${d[0]}`);
    const values = useWatch({
      control,
      name: names,
    });
    const [_notif, _gif, duration]: boolean[] = values;

    return (
      <>
        {data.map(([name, label], idx) => (
          <Toggle
            name={`routines.${index}.${name}`}
            value={values[idx]}
            label={label}
            key={name}
          />
        ))}
        {Boolean(duration) && (
          <FormDurationInput
            {...props}
            name={durationName}
            label="Duration in seconds"
          />
        )}
        <NumberPicker
          name={`routines.${index}.cycleCount`}
          label={"Number of repetitions"}
        />
      </>
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
        label="Description (optional)"
        ref={descriptionRef}
      />

      <Selections />

      <FormControl.Label>
        How does doing this activity make you feel?
      </FormControl.Label>
      <Center>
        <Controller
          control={props.control}
          rules={{
            required: false,
          }}
          render={({ field }) => (
            <FeelingPicker
              setValue={props.setValue}
              field={field}
              feelingName={feelingName}
            />
          )}
          name={feelingName}
          defaultValue=""
        />
      </Center>
    </View>
  );
};

export default AddRoutine;
