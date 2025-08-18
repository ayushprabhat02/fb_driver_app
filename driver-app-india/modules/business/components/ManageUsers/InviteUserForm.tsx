// dependencies
import {Keyboard, ScrollView, Share, StyleSheet, View} from 'react-native';
import React, {useState} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod'; // I
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';

// components
import {Button, Divider, Text} from '@/components';
import UserRoleTabs from './UserRoleTabs';

// types and styles
import {FBBorders, FBColors} from '@/types/styles';
import {commonInputStyles} from '@/styles';
import {UserRoleForInvitation} from '../../types';
import WalletLimit from './WalletLimit';
import {BusinessService} from '@/services';
import {businessStore} from '@/globalStore';
import {FetchOrganizationUsersOutput} from '@/generated/graphql';

type Props = {
  closeSheet: () => void;
};

type FormData = {
  phoneNumber: string;
  name: string;
};

const schema = z.object({
  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, {message: 'Invalid phone number'}),
  name: z.string().min(3, {message: 'Name must be at least 3 characters long'}),
});

const InviteUserForm: React.FC<Props> = ({closeSheet}) => {
  const currentOrgUserInView = businessStore.use.currentOrgUserInView();
  const currentOrgUsersList = businessStore.use.currentOrgUsersList();
  const [selectedUserRole, setSelectedUserRole] =
    useState<UserRoleForInvitation>('user');

  const [walletLimit, setWalletLimit] = useState<string>('10000');
  const [noWalletLimit, setNoWalletLimit] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    formState: {errors, isValid},
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const inviteUser = async (data: FormData) => {
    if (parseFloat(walletLimit) > 100000000) {
      Toast.show({
        type: 'error',
        text1: 'Wallet limit exceeded',
        text2: 'Maximum allowed wallet limit is 10,00,00,0000 (10 crore)',
      });

      return;
    }

    // have to check it using api only but its not giving correct output
    // const response = await BusinessService.checkIfPhoneNumberAlreadyExists({
    //   id: currentOrgUserInView?.id as string,
    //   phone_number: `+91${data?.phoneNumber.trim()}`,
    // });
    const isPhoneNumberAlreadyExists = currentOrgUsersList.some(
      (item: FetchOrganizationUsersOutput['organization_users']) =>
        item?.phone_number === `+91${data?.phoneNumber.trim()}`,
    );

    if (isPhoneNumberAlreadyExists) {
      Toast.show({
        type: 'error',
        text1: 'Entered user already exists',
      });
      return;
    }
    Keyboard.dismiss();

    BusinessService.fetchRoleIdByName({role: selectedUserRole}).then(
      async roleDetails => {
        const invitation = await BusinessService.addInvitation({
          object: {
            is_active: true,
            organization_id: currentOrgUserInView?.organization_id,
            phone_number: `+91${data?.phoneNumber}`,
            role_id: roleDetails?.id,
            status: 'UNUSED',
          },
        });

        const amount =
          selectedUserRole !== 'user' || noWalletLimit ? 0 : walletLimit;

        Share.share({
          message: `You are invited to join our team https://app.fuelbuddy.in/join-org?ivid=${invitation?.id}&ogid=${currentOrgUserInView?.organization_id}&phone=${data?.phoneNumber}&role=${roleDetails?.id}&type=DELIVERY&limit=${amount}`,
        }).finally(() => {
          closeSheet();
        });
      },
    );
  };

  return (
    <View style={{height: '97%'}}>
      <FormHeading />
      <Divider />
      <View style={{flex: 1}}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 16}}>
          {/* phone number */}
          <View>
            <Text color="steelBlue" size="sm">
              Phone Number
              <Text color="error" size="sm">
                *
              </Text>
            </Text>
            <Divider />
            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({field: {onChange, value}}) => (
                <View style={styles.input}>
                  <Text color="steelBlue" size="sm">
                    +91
                  </Text>
                  <BottomSheetTextInput
                    keyboardType="numeric"
                    style={{
                      color: FBColors.steelBlue,
                      width: '85%',
                      paddingVertical: 0,
                    }}
                    maxLength={10}
                    placeholder="Enter phone number"
                    placeholderTextColor={FBColors.placeHolderPrimary}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
              name="phoneNumber"
            />
            {errors?.phoneNumber ? (
              <View style={{marginTop: 8}}>
                <Text color="error" size="sm">
                  Invalid phone number
                </Text>
              </View>
            ) : null}
          </View>

          {/* name */}
          <Divider height={16} />
          <View>
            <Text color="steelBlue" size="sm">
              Name
              <Text color="error" size="sm">
                *
              </Text>
            </Text>
            <Divider />
            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({field: {onChange, value}}) => (
                <BottomSheetTextInput
                  style={[styles.input, styles.placeholderText]}
                  placeholder="Enter name of the person you want to invite"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="name"
            />
            {errors?.name && (
              <View style={{marginTop: 8}}>
                <Text color="error" size="sm">
                  {errors.name.message}
                </Text>
              </View>
            )}
          </View>

          {/* user role tabs */}
          <Divider height={16} />
          <UserRoleTabs
            selectedUserRole={selectedUserRole}
            setSelectedUserRole={setSelectedUserRole}
          />

          {/* user role tabs */}
          {selectedUserRole === 'user' ? (
            <>
              <Divider height={16} />
              <WalletLimit
                walletLimit={walletLimit}
                setWalletLimit={setWalletLimit}
                noWalletLimit={noWalletLimit}
                setNoWalletLimit={setNoWalletLimit}
              />
            </>
          ) : null}

          {/* invite/ submit button. dynamic margin is a workaround to keep btn position same regardless of wallet limit */}
          <Divider height={selectedUserRole === 'user' ? 50 : 120} />
          <Button
            disabled={!isValid}
            onPress={handleSubmit(inviteUser)}
            variant={'solid'}>
            Invite
          </Button>
        </ScrollView>
      </View>
    </View>
  );
};

const FormHeading: React.FC = () => {
  return (
    <View style={styles.heading}>
      <Text size="lg" weight="500">
        Invite User
      </Text>
      <Divider height={16} />
      <Text size="sm" color="complementary" style={{maxWidth: '95%'}}>
        You can invite a user to your business by entering their phone number
      </Text>
    </View>
  );
};

export default InviteUserForm;

const styles = StyleSheet.create({
  heading: {
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderColor: FBBorders.secondary,
  },

  input: {
    height: 40,
    fontSize: 14,
    color: FBColors.neutral,
    paddingVertical: 0,
    alignItems: 'center',
    columnGap: 10,
    flexDirection: 'row',
    ...commonInputStyles,
  },
  placeholderText: {
    fontSize: 14,
  },
});
