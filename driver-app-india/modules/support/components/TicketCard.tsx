// dependencies
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {DateTime} from 'luxon';

// components
import {Text, TextButton, Divider} from '@/components';

// types
import {Support_Tickets} from '@/generated/graphql';
import {FBColors} from '@/types/styles';

interface TicketComponentProps {
  ticket: Support_Tickets;
  orgUserName: string;
  viewTicketDetails: (id: string) => void;
}

const Ticket: React.FC<TicketComponentProps> = ({
  ticket,
  orgUserName,
  viewTicketDetails,
}) => {
  // const statusText = ticket.is_active ? 'On-going' : 'New';
  // const statusStyle = ticket.is_active
  //   ? styles.ongoingStatus
  //   : styles.newStatus;

  return (
    <View style={styles.ticketContainer}>
      <View style={styles.header}>
        <Text color="lightGray">
          <Text weight="bold">Ticket# </Text>
          {ticket?.support_ticket_erp_code ?? 'will update soon..'}
        </Text>
        {/* 
        <View style={[styles.statusContainer, statusStyle]}>
          <Text style={statusStyle}>{statusText}</Text>
        </View> */}
      </View>
      <Text size="sm" color="lightGray">
        Posted at:{' '}
        {ticket.created_at
          ? DateTime.fromISO(ticket.created_at, {zone: 'utc'})
              .setZone('Asia/Kolkata')
              .toFormat('dd-MM-yyyy') // Only date format
          : ''}
      </Text>

      <Divider height={20} />
      <Text>{ticket?.support_tickets_category?.category}</Text>
      <Text>{ticket?.support_tickets_subcategory?.subject}</Text>
      <Divider height={20} />
      <View style={styles.footer}>
        <Text size="sm" color="lightGray">
          {orgUserName} - Delivery
        </Text>
        <TextButton underline onPress={() => viewTicketDetails(ticket.id)}>
          View Ticket
        </TextButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ticketContainer: {
    backgroundColor: FBColors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  truncatedText: {
    maxWidth: '60%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ongoingStatus: {
    backgroundColor: FBColors.lightYellow,
    color: FBColors.amber,
  },
  newStatus: {
    backgroundColor: FBColors.primary,
    color: FBColors.secondary,
  },
});

export default Ticket;
