import PropTypes from "prop-types";
import React from "react";
import { TimePicker } from "react-native-simple-time-picker";
import { FormControl } from "native-base";
import { useColorScheme } from "react-native";

export const DurationInput: any = (props: any) => {
  const { label, error, onChange } = props;
  const scheme = useColorScheme();
  const isError = Boolean(error);

  return (
    <FormControl>
      {Boolean(label) && <FormControl.Label>{label}</FormControl.Label>}
      <TimePicker
        textColor={scheme === "dark" ? "white" : "black"}
        onChange={onChange}
        value={props.getValues(props.name)}
        pickerShows={["hours", "minutes", "seconds"]}
        hoursUnit="Hrs"
        minutesUnit="Mins"
        secondsUnit="Secs"
      />
      {isError && <FormControl.ErrorMessage>{error}</FormControl.ErrorMessage>}
    </FormControl>
  );
};
