import React from "react";
import { Box, Text, Button, Center, SectionList } from "native-base";
import { SafeAreaView } from "react-native-safe-area-context";

export const Settings = ({ data }) => {

  return (
    <SafeAreaView>
      <SectionList
        sections={data}
        keyExtractor={(item, index) => item + index}
        renderItem={({ item }) => {
          const { label, action } = item;
          return (
            <Button
              variant="outline"
              onPress={action}
              mx={5}
              py={2}
              rounded="md"
              my={2}
            >
              {label}
            </Button>
          );
        }}
        renderSectionHeader={({ section: { title } }) => (
          <Box
            px={5}
            py={2}
            rounded="md"
            bg="primary.200"
            _text={{
              fontWeight: "bold",
            }}
          >
            {title}
          </Box>
        )}
      />
    </SafeAreaView>
  );
};
