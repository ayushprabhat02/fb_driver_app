import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
import {StackNavigationProp} from '@react-navigation/stack';

// components
import {Button, Text, Divider, HeaderAvoidingContainer} from '@/components';
import {SupportStackParamList} from '@/navigator/containers/Support';
import {FormInputs} from '../components';

// services
import {SupportService} from '@/services';

// store
import {businessStore} from '@/globalStore';

// types
import {FormFields} from '../types';
import {schema} from '../schema/index';
import {Source_Type_Enum} from '@/generated/graphql';
import {DocumentPickerResponse} from 'react-native-document-picker';

type Props = {
  navigation: StackNavigationProp<SupportStackParamList, 'support-form'>;
};

const SupportForm: React.FC<Props> = ({navigation}) => {
  const activeProfile = businessStore.use.activeDeliveryOrgUser();
  const [fileData, setFileData] = React.useState<DocumentPickerResponse | null>(
    null,
  );
  const [attachmentData, setAttachmentData] =
    React.useState<DocumentPickerResponse | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<FormFields>({resolver: zodResolver(schema), defaultValues: {}});

  const submitTicket = async (data: FormFields) => {
    try {
      let attachmentURL;
      if (attachmentData) {
        attachmentURL = await SupportService.uploadFile({
          fileName: fileData?.name as string,
          contentType: attachmentData?.type as string,
          fileData: attachmentData,
        });
      }

      const payload = {
        message: data.ticketDescription,
        source: Source_Type_Enum.Customer,
        subject: data.ticketDescription,
        support_category_id: data.ticketType,
        support_tickets_subcategory_id: data.status,
        is_active: true,
        organization_user_id: activeProfile?.id,
        support_tickets_photos: attachmentURL?.storeUrl
          ? {
              data: [
                {
                  is_active: true,
                  url: attachmentURL?.storeUrl as string,
                },
              ],
            }
          : undefined,
      };

      await SupportService.createSupportTicket({object: payload}).finally(
        () => {
          SupportService.fetchSupportTicketsByOrgUserIds({
            organization_user_id: activeProfile?.id,
          });
        },
      );

      navigation.navigate('support-home');
      Toast.show({type: 'success', text1: 'Ticket submitted successfully'});
      setFileData(null);
      setAttachmentData(null);
      reset();
    } catch (e) {
      setError('root', {message: 'Error creating support ticket'});
      Toast.show({
        type: 'error',
        text1: 'Error creating support ticket',
        text2: 'Try again after some time',
      });
    }
  };

  return (
    <HeaderAvoidingContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{alignItems: 'center'}}
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Text weight="bold" size="lg">
              Create Support Ticket
            </Text>
            <Text>Write and address new queries and issues</Text>
          </View>
          <Divider height={20} />
          <View style={styles.formContainer}>
            <FormInputs control={control} errors={errors} setValue={setValue} />
          </View>
          <Divider height={40} />
          <Button
            disabled={isSubmitting}
            style={styles.btn}
            variant="solid"
            onPress={handleSubmit(submitTicket)}>
            {isSubmitting ? 'Submitting .. ' : 'Submit ticket'}
          </Button>
          {errors.root ? (
            <Text color="error">{errors.root.message}</Text>
          ) : null}
          <Divider height={40} />
        </ScrollView>
      </KeyboardAvoidingView>
    </HeaderAvoidingContainer>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  btn: {
    width: '100%',
  },
});

export default SupportForm;
