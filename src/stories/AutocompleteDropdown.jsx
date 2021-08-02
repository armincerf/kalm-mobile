import { View, Select, CheckIcon } from "native-base";
import React from "react";

export default ({ field, set }) => {
  const types = [
    "My Activities",
    "Meditation",
    "Chores",
    "Fitness",
    "Daily Routines",
    "Special Occasions",
  ];
  const label = "Select the type of routine you're creating";
  return (
    <Select
      selectedValue={field.value}
      minWidth={200}
      accessibilityLabel={label}
      placeholder={label}
      onValueChange={(itemValue) => set(field.name, itemValue)}
      _selectedItem={{
        bg: "cyan.600",
        endIcon: <CheckIcon size={4} />,
      }}
    >
      {types.map((item, index) => (
        <Select.Item key={index} value={item} label={item} />
      ))}
    </Select>
  );
};
