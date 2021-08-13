import React, { useCallback, useRef } from 'react'
import { useWatch, Controller, useForm } from 'react-hook-form'
import {
  Center,
  ScrollView,
  FormControl,
  Pressable,
  HStack,
  Image,
  Text,
  Accordion,
  Button,
} from 'native-base'
import { FormTextInput } from './FormTextInput'
import { FormDurationInput } from './FormDurationInput'
import { vibrate, COLOR_ACCENT } from './utils'
import InputSpinner from 'react-native-input-spinner'

const FeelingPicker = ({ setValue, field, feelingName }) => {
  //apparently you can't dynamically require things :/
  const kalmFace = require(`../../assets/images/kalm.png`)
  const panikFace = require(`../../assets/images/panik.png`)
  const extraPanikFace = require(`../../assets/images/extraPanik.png`)
  const FeelingButton = ({ feel, field, src }) => {
    const isSelected = feel === field.value
    return (
      <Pressable
        borderRadius={5}
        paddingX={2}
        paddingY={4}
        borderWidth={isSelected ? 2 : 0}
        onPress={() => {
          if (feel === 'kalm') {
            vibrate('weak')
          } else if (feel === 'extraPanik') {
            vibrate('hard')
          } else {
            vibrate('medium')
          }
          setValue(feelingName, feel)
        }}
      >
        <Image size={isSelected ? 'xl' : 'lg'} source={src} alt={feel} />
      </Pressable>
    )
  }
  return (
    <HStack>
      {[
        ['kalm', kalmFace],
        ['panik', panikFace],
        ['extraPanik', extraPanikFace],
      ].map(([feeling, src]) => (
        <FeelingButton feel={feeling} key={feeling} field={field} src={src} />
      ))}
    </HStack>
  )
}

const FeedbackForm = ({handleSubmit}) => {
  const descriptionRef = useRef<any>(null)
  const feelingName = `feeling`
  const focusDescription = useCallback(() => descriptionRef?.current?.focus(), [
    descriptionRef,
  ])
  const props = useForm();

  return (
    <ScrollView width="90%" m={4}>
      <FormTextInput
        {...props}
        autoFocus={true}
        name={`name`}
        placeholder="Anonymous"
        label="Name (optional)"
        onSubmitEditing={focusDescription}
        returnKeyType="next"
      />

      <FormTextInput
        {...props}
        name={`description`}
        textArea
        label="Feedback (optional)"
        ref={descriptionRef}
      />

      <FormControl.Label>
        How does this app make you feel?
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
        <Button m={2} onPress={props.handleSubmit(handleSubmit)}>
            Submit
        </Button>
      </Center>
    </ScrollView>
  )
}
export default FeedbackForm
