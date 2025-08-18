//dependenceis
import React from 'react';
import {SafeAreaView, View, FlatList} from 'react-native';
import {ScaledSheet, ms} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
//components
import {IconButton, Container, GradientPrimary} from '@/components';
import {TicketCard} from '@/modules/support/components';

//styles
import {FBColorPalette} from '@/types/styles';
import {headerTransparentContainer} from '@/styles';

//types
import {StackNavigationProp} from '@react-navigation/stack';
import {SupportStackParamList} from '@/navigator/containers/Support';
import {supportStore} from '@/globalStore';

type Props = {
  navigation: StackNavigationProp<SupportStackParamList, 'support-tickets'>;
};
const SupportTickets: React.FC<Props> = ({navigation}) => {
  return (
    <GradientPrimary>
      <SafeAreaView>
        <Container style={styles.containerTop}>
          <View>
            <IconButton
              variant="outlined"
              style={styles.iconButton}
              onPress={() => {
                navigation.navigate('support-form');
              }}>
              <IconButton.Icon>
                <Icon
                  name="pen-plus"
                  color={FBColorPalette.complementary}
                  size={ms(15)}
                />
              </IconButton.Icon>
              <IconButton.Text
                textStyle={{
                  color: FBColorPalette.complementary,
                  fontSize: ms(15),
                }}>
                New ticket
              </IconButton.Text>
            </IconButton>

            <FlatList
              data={supportStore.getState().supportTickets}
              keyExtractor={(ticket: any) => ticket.id}
              // extraData={refreshFlatList}
              renderItem={(ticket: any) => (
                <TicketCard
                  ticketDetails={ticket.item}
                  viewTicketDetails={(id: string) => {
                    navigation.navigate('support-ticket-details', {
                      ticketId: id,
                    });
                  }}
                />
              )}
              windowSize={10}
              style={{
                height: '92%',
                marginTop: ms(20),
              }}
              initialNumToRender={7}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Container>
      </SafeAreaView>
    </GradientPrimary>
  );
};

const styles = ScaledSheet.create({
  containerTop: {
    ...headerTransparentContainer,
  },
  iconButton: {
    height: '30@vs',
    width: '120@ms',
    padding: '5@ms',
    borderRadius: '5@ms',
    justifyContent: 'space-evenly',
    color: FBColorPalette.complementary,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SupportTickets;
