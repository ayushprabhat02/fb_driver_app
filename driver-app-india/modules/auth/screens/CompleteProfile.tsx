// dependencies
import {View, ScrollView} from 'react-native';
import React, {useEffect, useRef} from 'react';
import BottomSheet, {
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {ArrowRight} from 'phosphor-react-native';

// components
import {
  Divider,
  HeaderAvoidingContainer,
  IconButton,
  NewBottomSheet,
  Text,
} from '@/components';

// styles and types
import {commonBottomSheetView, commonInputStyles} from '@/styles';
import {FBBorders, FBColors} from '@/types/styles';

const CompleteProfile: React.FC = () => {
  const bottomSheeRef = useRef<BottomSheet>(null);

  const openSheet = () => {
    bottomSheeRef.current?.expand();
  };

  useEffect(() => {
    openSheet();
  }, []);

  return (
    <HeaderAvoidingContainer>
      <Text>Complete Profile Page</Text>
      <NewBottomSheet
        ref={bottomSheeRef}
        snapPoints={['88%']}
        index={0}
        showCloseBtn={false}>
        <BottomSheetView style={commonBottomSheetView}>
          <View
            style={{
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderColor: FBBorders.secondary,
            }}>
            <Text size="lg" weight="600">
              Your profile needs attention
            </Text>
            <Divider />
            <Text size="sm" color="complementary">
              To enhance your experience, we kindly ask you to update your
              profile information.
            </Text>
          </View>
          <Divider />
          <ScrollView
            contentContainerStyle={{paddingBottom: 16}}
            showsVerticalScrollIndicator={false}>
            {/* names */}
            <View>
              <Text size="sm" color="steelBlue">
                Enter your name<Text color="error">*</Text>
              </Text>
              <Divider />
              <View style={{flexDirection: 'row', columnGap: 20}}>
                <BottomSheetTextInput
                  placeholder="First Name"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  style={[
                    commonInputStyles,
                    {flex: 1, height: 40, fontSize: 14, paddingVertical: 0},
                  ]}
                />
                <BottomSheetTextInput
                  placeholder="Last Name"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  style={[
                    commonInputStyles,
                    {flex: 1, height: 40, fontSize: 14, paddingVertical: 0},
                  ]}
                />
              </View>
            </View>

            {/* mobile number */}
            <Divider height={24} />
            <View>
              <Text size="sm" color="steelBlue">
                Mobile Number
              </Text>
              <Divider />
              <View>
                <BottomSheetTextInput
                  placeholder="+919999999999"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  style={[
                    commonInputStyles,
                    {flex: 1, height: 40, fontSize: 14, paddingVertical: 0},
                  ]}
                />
              </View>
            </View>

            {/* Customer segmentation */}
            <Divider height={24} />
            <View>
              <Text size="sm" color="steelBlue">
                Customer segmentation<Text color="error">*</Text>
              </Text>
              <Divider />
              <View>
                <BottomSheetTextInput
                  placeholder="Select customer type"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  style={[
                    commonInputStyles,
                    {flex: 1, height: 40, fontSize: 14, paddingVertical: 0},
                  ]}
                />
              </View>
            </View>

            {/* email  */}
            <Divider height={24} />
            <View>
              <Text size="sm" color="steelBlue">
                Email<Text color="error">*</Text>
              </Text>
              <Divider />
              <View>
                <BottomSheetTextInput
                  placeholder="Enter email address"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  style={[
                    commonInputStyles,
                    {flex: 1, height: 40, fontSize: 14, paddingVertical: 0},
                  ]}
                />
              </View>
            </View>

            {/* PAN card  */}
            <Divider height={24} />
            <View>
              <Text size="sm" color="steelBlue">
                PAN Number{' '}
                <Text size="sm" color="lightGray" style={{fontStyle: 'italic'}}>
                  (optional)
                </Text>
              </Text>
              <Divider />
              <View>
                <BottomSheetTextInput
                  placeholder="Enter PAN card number"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  style={[
                    commonInputStyles,
                    {flex: 1, height: 40, fontSize: 14, paddingVertical: 0},
                  ]}
                />
              </View>
            </View>
            <Divider height={24} />
            <IconButton onPress={() => {}} variant="solid" style={{height: 48}}>
              <IconButton.Text>Continue</IconButton.Text>
              <IconButton.Icon>
                <ArrowRight
                  size={16}
                  color={FBColors.white}
                  style={{marginTop: 4}}
                />
              </IconButton.Icon>
            </IconButton>
          </ScrollView>
        </BottomSheetView>
      </NewBottomSheet>
    </HeaderAvoidingContainer>
  );
};

export default CompleteProfile;
