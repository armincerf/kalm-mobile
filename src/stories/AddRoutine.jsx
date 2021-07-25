import React from 'react';
import {
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
  VStack,
  Button,
  FormControl,
  Input,
  Center
} from 'native-base';

export default ({handleSubmit}) => {
  const [formData, setData] = React.useState({});
  const [errors, setErrors] = React.useState({});
    console.log(handleSubmit);
  const validate = () => {
    if (formData.name === undefined) {
      setErrors({
        ...errors,
        name: 'Name is required',
      });
      return false;
    } else if (formData.name.length < 3) {
      setErrors({
        ...errors,
        name: 'Name is too short',
      });
      return false;
    }
    return true;
  };

  const onSubmit = () => {
      validate() ? handleSubmit(formData) : console.log('Validation Failed');
  };

  return (
    <VStack width="90%" m={3}>
      <FormControl isRequired isInvalid={'name' in errors}>
        <FormControl.Label _text={{bold: true}}>Name</FormControl.Label>
        <Input
            placeholder="Do the hoovering"
          onChangeText={(value) => setData({ ...formData, name: value })}
        />
        {'name' in errors ?
        <FormControl.ErrorMessage _text={{fontSize: 'xs', color: 'error.500', fontWeight: 500}}>Error</FormControl.ErrorMessage>
:

        <FormControl.HelperText _text={{fontSize: 'xs'}}>
          Name should contain atleast 3 character.
        </FormControl.HelperText>
        }
      </FormControl>
        <FormControl isRequired isInvalid={'description' in errors}>
            <FormControl.Label _text={{bold: true}}>Description</FormControl.Label>
            <Input
                placeholder="Hoover the dirt"
                onChangeText={(value) => setData({ ...formData, description: value })}
            />
            {'description' in errors ?
             <FormControl.ErrorMessage _text={{fontSize: 'xs', color: 'error.500', fontWeight: 500}}>Error</FormControl.ErrorMessage>
             :

             <FormControl.HelperText _text={{fontSize: 'xs'}}>
                 Description should contain atleast 3 character.
             </FormControl.HelperText>
            }
        </FormControl>
        <FormControl isRequired isInvalid={'duration' in errors}>
            <FormControl.Label _text={{bold: true}}>Duration in seconds</FormControl.Label>
            <NumberInput
                onChange={(value) => setData({ ...formData, duration: value })}
                 min={1} max={10000} step={1}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
            {'duration' in errors ?
             <FormControl.ErrorMessage _text={{fontSize: 'xs', color: 'error.500', fontWeight: 500}}>Error</FormControl.ErrorMessage>
             :

             <FormControl.HelperText _text={{fontSize: 'xs'}}>
                 Duration should be a number
             </FormControl.HelperText>
            }
        </FormControl>


    <Button onPress={onSubmit} mt={5} colorScheme="cyan">
      Submit
    </Button>
    </VStack>
  );
}
