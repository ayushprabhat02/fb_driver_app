import React from 'react';
import {View, ScrollView} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Divider, HeaderAvoidingContainer, Text} from '@/components';
import {FBColors} from '@/types/styles';
import {supportStore} from '@/globalStore';

const SupportTicketDetails = () => {
  const ticketERPDetails = supportStore.use.erpTicketDetails();

  const renderDetailRow = (label: string, value: string | undefined) => (
    <View>
      <Text weight="bold">{label}</Text>
      <Divider height={5} />
      <Text color="lightGray">{value || 'N/A'}</Text>
    </View>
  );

  return (
    <HeaderAvoidingContainer>
      <ScrollView>
        {ticketERPDetails?.issue ? (
          <>
            <View style={styles.header}>
              <Text weight="bold" size="lg">
                Ticket# {ticketERPDetails?.issue?.name}
              </Text>
              <View style={styles.ticketStatusContainer}>
                <Text color="white">{ticketERPDetails?.issue?.status}</Text>
              </View>
            </View>
            <Text size="sm" color="lightGray">
              {ticketERPDetails?.issue?.opening_date}
            </Text>
            <Divider height={20} />
            <View style={styles.userInfo}>
              <Text weight="bold">
                {ticketERPDetails?.issue?.custom_customer_name}
              </Text>
              <Text color="lightGray">Delivery</Text>
            </View>
            <Divider height={20} />
            {renderDetailRow('Email', ticketERPDetails?.issue?.custom_email_id)}
            <Divider height={20} />
            {renderDetailRow(
              'Request ticket type',
              ticketERPDetails?.issue?.custom_ticket_created_by,
            )}
            <Divider height={20} />
            {renderDetailRow(
              'Select issue type',
              ticketERPDetails?.issue?.custom_ticket_sub_category,
            )}
            <Divider height={20} />
            {renderDetailRow(
              'Description',
              ticketERPDetails?.issue?.description,
            )}
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Text color="lightGray">
              Creating your ticket may take a moment.
            </Text>
            <Text color="lightGray">Thank you for your patience.</Text>
          </View>
        )}
      </ScrollView>
    </HeaderAvoidingContainer>
  );
};

const styles = ScaledSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailValue: {
    flex: 1,
  },
  ticketStatusContainer: {
    backgroundColor: FBColors.amber,
    paddingVertical: '4@ms',
    paddingHorizontal: '8@ms',
    borderRadius: '6@ms',
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20@s',
  },
});

export default SupportTicketDetails;
