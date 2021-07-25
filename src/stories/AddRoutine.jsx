import React from 'react';
import {
    ScrollView,
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
import { Keyboard,  TouchableWithoutFeedback, View } from 'react-native';
import { TimePicker } from 'react-native-simple-time-picker';

export default ({handleSubmit}) => {
    const removeKey = (key, {[key]: _, ...rest}) => rest;
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
        } else {
            setErrors( removeKey('name', errors));
        }


        if (formData.description === undefined) {
            setErrors({
                ...errors,
                description: 'Description is required',
            });
            return false;
        }
        else if (formData.description && formData.description.length < 3) {
            setErrors({
                ...errors,
                description: 'Description is too short',
            });
            return false;
        }

        if (formData.duration === undefined) {
            setErrors({
                ...errors,
                duration: 'Duration is required',
            });
            return false;
        }
        else if (formData.duration > 100000 || !Number.isInteger(formData.duration)) {
            setErrors({
                ...errors,
                duration: 'Duration must be a number between 1 and 100,000',
            });
            return false;
        }
        setErrors({});
        return true;
    };

    const onSubmit = () => {
        validate() ? handleSubmit(formData) : console.log('Validation Failed');
    };

    const DismissKeyboard = ({ children }) => (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            {children}
        </TouchableWithoutFeedback>
    );

    return (
        <ScrollView>
            <VStack width="90%" m={3}>
                <FormControl isRequired isInvalid={'name' in errors}>
                    <FormControl.Label _text={{bold: true}}>Name</FormControl.Label>

                    <Input
                        placeholder="Do the hoovering"
                        onChangeText={(value) => setData({ ...formData, name: value })}
                    />
                    {'name' in errors ?
                     <FormControl.ErrorMessage _text={{fontSize: 'xs', color: 'error.500', fontWeight: 500}}>
                         {errors.name}
                     </FormControl.ErrorMessage>
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
                     <FormControl.ErrorMessage _text={{fontSize: 'xs', color: 'error.500', fontWeight: 500}}>
                         {errors.description}
                     </FormControl.ErrorMessage>
                     :

                     <FormControl.HelperText _text={{fontSize: 'xs'}}>
                         Description should contain atleast 3 character.
                     </FormControl.HelperText>
                    }
                </FormControl>
                <FormControl isRequired isInvalid={'duration' in errors}>
                    <FormControl.Label _text={{bold: true}}>Duration</FormControl.Label>
                    <TimePicker
                        onChange={({hours, minutes, seconds}) => {
                            const hourSeconds = hours * 3600;
                            const minSeconds = minutes * 60;
                            setData({ ...formData, duration: seconds + minSeconds + hourSeconds });
                        }}
                        pickerShows={["hours", "minutes", "seconds"]}
                        zeroPadding={true}
                        hoursUnit="Hrs"
                        minutesUnit="Mins"
                        secondsUnit="Secs"
                    />
                    {'duration' in errors ?
                     <FormControl.ErrorMessage _text={{fontSize: 'xs', color: 'error.500', fontWeight: 500}}>
                         {errors.duration}
                     </FormControl.ErrorMessage>
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
        </ScrollView>
    );
}
