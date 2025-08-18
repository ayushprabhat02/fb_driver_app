import React, {useState, useCallback} from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {useFocusEffect} from '@react-navigation/native';

// components
import {Divider, HeaderAvoidingContainer, IconButton, Text} from '@/components';
import {SupportStackParamList} from '@/navigator/containers/Support';
import {businessStore, supportStore} from '@/globalStore';
import {TicketCard, TicketSkeleton} from '../components';

// services and types
import {SupportService} from '@/services';
import {FBColorPalette} from '@/types/styles';
import {Support_Tickets} from '@/generated/graphql';

type Props = {
  navigation: StackNavigationProp<SupportStackParamList, 'support-home'>;
};

const SupportHome: React.FC<Props> = ({navigation}) => {
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const supportTicketsByOrgUserIds = supportStore.use.supportTickets();
  const activeProfile = businessStore.use.activeDeliveryOrgUser();
  const supportTicketsOffset = supportStore.use.supportTicketsOffset();
  const supportTicketsHasMoreOrders =
    supportStore.use.supportTicketsHasMoreOrders();
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const FBVaultImage = require('@/assets/support/NoTicket.png');

  const fetchAllData = useCallback(async () => {
    setLoading(true);

    try {
      const ticketsResponse =
        await SupportService.fetchSupportTicketsByOrgUserIds({
          limit: 10,
          organization_user_id: activeProfile?.id,
          offset: supportTicketsOffset,
        });

      if (!ticketsResponse) {
        Toast.show({
          type: 'error',
          text1: 'No tickets found',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error fetching data',
      });
    } finally {
      setLoading(false);
      setFetching(false);
    }

    setTimeout(() => {
      setRefreshing(false);
    }, 3000);
  }, [activeProfile?.id, supportTicketsOffset]);

  const loadMoreTickets = () => {
    if (!supportTicketsHasMoreOrders || fetching) {
      return;
    }

    setFetching(true);
    supportStore.setState(state => ({
      ...state,
      supportTicketsOffset: supportTicketsOffset + 10,
    }));
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData]),
  );

  const viewTicketDetails = async (id: string) => {
    try {
      await SupportService.fetchTicketDetailsFromERP({
        object: {
          support_ticket_id: id,
        },
      });
      navigation.navigate('support-ticket-details');
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  return (
    <HeaderAvoidingContainer>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : supportTicketsByOrgUserIds.length > 0 ? (
        <>
          <View style={styles.addBtnContainer}>
            <IconButton
              variant="outlined"
              onPress={() => {
                navigation.navigate('support-form');
              }}>
              <IconButton.Icon>
                <Icon name="pen-plus" color={FBColorPalette.complementary} />
              </IconButton.Icon>
              <IconButton.Text>New ticket</IconButton.Text>
            </IconButton>
          </View>
          <FlatList
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchAllData}
              />
            }
            contentContainerStyle={{padding: 16}}
            data={supportTicketsByOrgUserIds.sort((a, b) => {
              return (
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
              );
            })}
            renderItem={({item}) => (
              <TicketCard
                ticket={item as Support_Tickets}
                viewTicketDetails={viewTicketDetails}
                orgUserName={activeProfile?.user?.first_name as string}
              />
            )}
            keyExtractor={item => item.id}
            onEndReached={loadMoreTickets}
            onEndReachedThreshold={0.5}
            ListFooterComponent={fetching ? <TicketSkeleton /> : null}
          />
        </>
      ) : (
        <View style={styles.noData}>
          <Image source={FBVaultImage} />
          <Text size="xl" color="lightGray">
            Submit your ticket
          </Text>
          <Text size="xl" color="lightGray">
            and we'll be in touch soon!
          </Text>
          <Divider height={16} />
          <IconButton
            variant="outlined"
            onPress={() => {
              navigation.navigate('support-form');
            }}>
            <IconButton.Icon>
              <Icon name="pen-plus" color={FBColorPalette.complementary} />
            </IconButton.Icon>
            <IconButton.Text>Create Ticket</IconButton.Text>
          </IconButton>
        </View>
      )}
    </HeaderAvoidingContainer>
  );
};

const styles = StyleSheet.create({
  addBtnContainer: {
    alignItems: 'flex-end',
    width: '100%',
    paddingTop: 10,
    paddingRight: 16,
  },
  noData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SupportHome;
