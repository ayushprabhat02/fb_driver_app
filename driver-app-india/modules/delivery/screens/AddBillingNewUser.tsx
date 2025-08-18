import React from 'react';

// components
import {HeaderAvoidingContainer} from '@/components';
import AddBillingNewForm from '../components/address/AddBillingNewForm';

const AddBillingNewUser: React.FC = () => {
  return (
    <HeaderAvoidingContainer>
      <AddBillingNewForm />
    </HeaderAvoidingContainer>
  );
};

export default AddBillingNewUser;
