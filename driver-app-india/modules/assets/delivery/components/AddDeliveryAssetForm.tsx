// dependencies
import {ViewStyle, RegisteredStyle} from 'react-native';
import React from 'react';
import {BottomSheetView} from '@gorhom/bottom-sheet';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod'; // Import zodResolver
import * as z from 'zod';
import Toast from 'react-native-toast-message';

//services
import {AssetService} from '@/services';

//store
import {assetStore} from '@/globalStore';

//actions
import {localStorage, getActiveDelOrgUserId} from '@/utils/localStorage';

// components
import {Button, Text} from '@/components';
import {CustomBottomFormInput} from '@/modules/fillupRequest/components';

//types
import {Order_By} from '@/generated/graphql';
import {ScrollView} from 'react-native-gesture-handler';

//props
type Props = {
  formContainerStyles: RegisteredStyle<ViewStyle>;
  selectedTab: 'genset' | 'tank' | 'dot' | 'others';
  closeModal: () => void;
};

const AddDeliveryAssetForm: React.FC<Props> = ({
  formContainerStyles,
  selectedTab,
  closeModal,
}) => {
  //zod schema for validation
  const schema = z.object({
    name: z.string().min(1, {message: 'Please enter asset name'}),
    capacity: z
      .string()
      .regex(/^\d+(\.\d+)?$/, {
        message: 'Please enter a valid number',
      })
      .min(1, {message: 'Capacity is required'}),
    identificationNumber:
      selectedTab === 'others'
        ? z
            .string()
            .regex(/^[A-Z]{2}\d{2}[A-Z]{1}\d{4}$/, {
              message: 'Please enter a valid asset registration number',
            })
            .min(5, {message: 'ID is required'})
        : z.string().min(1, {message: 'ID is required'}),
  });
  type FormFields = z.infer<typeof schema>;
  const defaultValues = {
    name: '',
    capacity: '',
    identificationNumber: '',
  };

  const {
    control,
    handleSubmit,
    setError,
    formState: {errors, isSubmitting},
  } = useForm<FormFields>({resolver: zodResolver(schema), defaultValues});

  const submitHandler = async (data: FormFields) => {
    const assetTypes = assetStore.getState().assetTypes;
    const selectedTabId = (assetTypes as any).find(
      (type: any) => type.slug === selectedTab,
    ).id;

    try {
      await AssetService.addCustomerAsset({
        asset_type_id: selectedTabId,
        capacity: `${data?.capacity}`,
        description: data?.identificationNumber || '',
        is_active: true,
        name: data?.name,
        organization_user_id: localStorage.getString(
          'deliveryOrgUserId',
        ) as string,
        registration_number: data?.identificationNumber,
        slug: data?.identificationNumber,
        color: '',
        make: '',
        modal: '',
      }).then(() => {
        AssetService.getAllCustomerAssets({
          organization_user_id: getActiveDelOrgUserId(),
          limit: 100,
          search_key: '%%',
        }).then(response => {
          /**
           * Here we filter all the fetched assets by asset type for the first time and set it to currentAssetsInView
           * This is done to show the assets of the selected tab initially
           * If we skip this, no the assets will be shown initially until the user manually selects a tab
           * This is done only once when the component mounts
           */
          assetStore.setState(state => ({
            ...state,
            currentAssetsInView: response.filter(asset => {
              return asset.asset_type?.slug === selectedTab;
            }),
          }));
        });
        Toast.show({type: 'success', text1: 'Asset added successfully'});
      });
    } catch (e) {
      Toast.show({type: 'error', text1: 'Error adding asset'});
      setError('root', {message: 'no error'});
      throw new Error('error adding customer asset');
    } finally {
      closeModal();
    }
  };
  return (
    <BottomSheetView style={formContainerStyles}>
      <ScrollView style={{minHeight: '80%', maxHeight: '95%'}}>
        <CustomBottomFormInput
          name="name"
          label="Name"
          control={control}
          errors={errors}
          placeholder="name"
          textInputStyle={{width: '70%'}}
          inputContainerStyle={{marginBottom: 10}}
        />
        <CustomBottomFormInput
          name="capacity"
          label="Fuel Capacity"
          control={control}
          errors={errors}
          placeholder={'capacity'}
          keyboardType={'numeric'}
          inputContainerStyle={{marginBottom: 10}}
        />
        <CustomBottomFormInput
          name="identificationNumber"
          label="Identification No. ( Plate No. Serial No. etc )"
          control={control}
          errors={errors}
          placeholder="( Plate No. Serial No. etc )"
          inputContainerStyle={{marginBottom: 10}}
        />
        <Button
          variant="outlined"
          style={{width: '80%', alignSelf: 'center', marginTop: 10}}
          onPress={() => {
            handleSubmit(submitHandler)(); //force execution to submit
          }}>
          {isSubmitting ? 'Adding .. ' : 'Add Asset'}
        </Button>
        {errors && <Text style={{color: 'red'}}>{errors.root?.message}</Text>}
      </ScrollView>
    </BottomSheetView>
  );
};

export default AddDeliveryAssetForm;
