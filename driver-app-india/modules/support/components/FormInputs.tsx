// todo: r&d needed. improve later
// dependencies
import React, {useEffect, useLayoutEffect, useState} from 'react';
import {Control, FieldErrors} from 'react-hook-form';
import {StyleSheet} from 'react-native';

// components
import {CustomFormInput} from '@/modules/user/components';
import {CustomSelectInput} from '@/modules/address/components';
import {Divider} from '@/components';

// services
import {businessStore} from '@/globalStore';
import {SupportService} from '@/services';

// types
import {FormFields} from '../types';

type FormInputsProps = {
  control: Control<FormFields>;
  errors: FieldErrors<FormFields>;
  setValue: (name: keyof FormFields, value: string) => void;
};

const FormInputs: React.FC<FormInputsProps> = ({control, errors, setValue}) => {
  const user = businessStore.use.activeDeliveryOrgUser();
  const [ticketCategories, setTicketCategories] = useState<any>();
  const [ticketSubCategories, setTicketSubCategories] = useState<any>();
  const [selectedTicketCategory, setSelectedTicketCategory] = useState('');

  useLayoutEffect(() => {
    fetchCategories(setTicketCategories);
  }, []);

  useEffect(() => {
    if (user) {
      setValue('name', user?.user?.first_name || '');
      setValue('email', user?.user?.email?.trim() || '');
    }
  }, [user, setValue]);

  useEffect(() => {
    if (selectedTicketCategory) {
      fetchSubCategories(selectedTicketCategory, setTicketSubCategories);
    }
  }, [selectedTicketCategory]);

  return (
    <>
      <CustomFormInput
        name="name"
        label="Name"
        control={control}
        errors={errors}
        editable={false}
        placeholder="Your name"
        required={true}
        textInputStyle={{height: '40@ms'}}
      />
      <Divider height={10} />
      <CustomFormInput
        name="email"
        label="Email"
        control={control}
        errors={errors}
        editable={false}
        placeholder="Your email"
        required={true}
        keyboardType="email-address"
        textInputStyle={{height: '40@ms'}}
      />
      <Divider height={10} />
      {ticketCategories && (
        <CustomSelectInput
          name="ticketType"
          label="Request Ticket Type"
          control={control}
          errors={errors}
          placeholder="Choose type"
          required={true}
          items={ticketCategories}
          setChange={setSelectedTicketCategory}
          renderObject={item => ({
            label: item.category,
            value: item.id,
            key: item.id,
          })}
          rules={{required: 'Request Ticket Type is required'}}
        />
      )}
      {ticketSubCategories && (
        <CustomSelectInput
          name="status"
          label="Select Status"
          control={control}
          errors={errors}
          placeholder="Select status"
          required={true}
          items={ticketSubCategories}
          setChange={() => {}}
          renderObject={item => ({
            label: item.subject,
            value: item.id,
            key: item.id,
          })}
        />
      )}
      <CustomFormInput
        name="ticketDescription"
        label="Ticket Description"
        control={control}
        errors={errors}
        required={true}
        placeholder="Enter your issue here"
        textInputStyle={{height: '40@ms'}}
      />
    </>
  );
};

const fetchCategories = async (
  setTicketCategories: React.Dispatch<React.SetStateAction<any>>,
) => {
  const categories = await SupportService.fetchSupportTicketCategories();
  setTicketCategories(categories);
};

const fetchSubCategories = async (
  selectedTicketCategory: string,
  setTicketSubCategories: React.Dispatch<React.SetStateAction<any>>,
) => {
  const subCategories = await SupportService.fetchSupportTicketSubCategories({
    supportTicketsCategoryId: selectedTicketCategory,
  });
  setTicketSubCategories(subCategories);
};

export const styles = StyleSheet.create({
  note: {
    height: 50,
  },
});

export default FormInputs;
