import { AutocompleteDropdown } from "react-native-autocomplete-dropdown";
import { Text, View } from "react-native";
import React from "react";

export default ({ field, set }) => {
  return (
    <View>
      <AutocompleteDropdown
        clearOnFocus={false}
        closeOnBlur={true}
        closeOnSubmit={false}
        onSelectItem={(item) => {
          if (item?.title) {
            set(field.name, item.title);
          }
        }}
        textInputProps={{
          placeholder: "Choose a type",
          onBlur: field.onBlur,
          onChange: field.onChange,
          autoCorrect: false,
          autoCapitalize: "none",
          style: {
            paddingLeft: 18,
            borderRadius: 4,
          }
        }}
        dataSet={[
          { id: "1", title: "My Activities" },
          { id: "2", title: "Meditation" },
          { id: "3", title: "Chores" },
          { id: "4", title: "Fitness" },
          { id: "5", title: "Daily Routines" },
          { id: "6", title: "Special Occasions" },
        ]}
      />
    </View>
  );
};
