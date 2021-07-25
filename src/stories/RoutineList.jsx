import React from "react"
import { Box, SectionList, Button} from "native-base"
export default ({data, handlePress}) => {
  return (
    <SectionList
      sections={data}
      keyExtractor={(item, index) => item + index}
      renderItem={({item}) => (
          <Box px={5} py={2} rounded="md" my={2} >
            <Button onPress={() => handlePress(item)}>
            {item.name}
          </Button>
        </Box>
      )}
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
  )
}
