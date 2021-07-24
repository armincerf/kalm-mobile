import React from "react"
import {
    Button,
    Text,
    Actionsheet,
    useDisclose,
    Center,
    NativeBaseProvider,
} from "native-base"

export default function Example() {
    const { isOpen, onOpen, onClose } = useDisclose()
    return (
        <>
          <Button onPress={onOpen}>Example JSX component</Button>

          <Actionsheet isOpen={isOpen} onClose={onClose}>
            <Actionsheet.Content>
              {[...Array(9)].map((e, i) =>
                  <Actionsheet.Item
                    onPress={() => alert(i)}
                    key={i}>
                    {`Option ${i}`}
                  </Actionsheet.Item>)}

            </Actionsheet.Content>
          </Actionsheet>
        </>
    )
}
