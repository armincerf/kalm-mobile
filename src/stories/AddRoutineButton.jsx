import { Fab, Icon, Box, Center, NativeBaseProvider } from "native-base"
import React from "react"
import { AntDesign } from "@expo/vector-icons"

export default ({handleClick}) => {
    return (
            <Fab
                position="absolute"
                onPress={handleClick}
                size="sm"
                m={5}
                renderInPortal={false}
                icon={<Icon color="white" as={<AntDesign name="plus" />} size="sm" />}
            />
    )

}
