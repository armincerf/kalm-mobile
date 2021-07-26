import PropTypes from "prop-types";
import React from "react";
import { TimePicker } from "react-native-simple-time-picker";
import { Wrapper, Label, Error } from "./constants";

export const DurationInput: any = (props: any) => {
  const { label, error, onChange } = props;
  const isError = Boolean(error);
  return (
    <Wrapper>
      {Boolean(label) && <Label>{label}</Label>}
      <TimePicker
        onChange={onChange}
        value={props.getValues(props.name)}
        pickerShows={["hours", "minutes", "seconds"]}
        zeroPadding={true}
        hoursUnit="Hrs"
        minutesUnit="Mins"
        secondsUnit="Secs"
      />
      {isError && <Error>{error}</Error>}
    </Wrapper>
  );
};
