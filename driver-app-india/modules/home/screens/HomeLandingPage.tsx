//dependencies
import React from 'react';
import {View, ScrollView, Platform} from 'react-native';
import {vs, ms, ScaledSheet} from 'react-native-size-matters';

//components
import {
  Divider,
  ImageCard,
  Text,
  Container,
  GradientPrimary,
} from '@/components';

//types and interfaces
import {FBColorPalette} from '@/types/styles';
interface HomeLandingPageProps {} // No props for now

import {ForYouDecoration, BusinessHomeCard} from '../components/delivery';

//images
const pumpImage = require('@/assets/home/pump.png');
const bowserImage = require('@/assets/home/bowser.png');
const giftImage = require('@/assets/home/gift.png');
const evImage = require('@/assets/home/ev.png');

const HomeLandingPage: React.FC<HomeLandingPageProps> = () => {
  return (
    <GradientPrimary>
      <ScrollView style={styles.body}>
        <Container paddingHorizontal={20}>
          {/* top image cards*/}
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: ms(5),
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <ImageCard
              imageSource={pumpImage}
              title="Drive-In"
              description="Get best deals on pumps"
              cardStyle={styles.lightCard} // Shorten type casting
              titleStyle={{
                fontSize: ms(18),
                color: FBColorPalette.secondary,
              }}
              descriptionStyle={{
                fontSize: ms(10),
                marginTop: vs(5),
                fontWeight: 'bold',
                color: FBColorPalette.secondary,
              }}
            />
            <ImageCard
              imageSource={bowserImage}
              title="Delivery"
              description="Get doorstep fuel delivery"
              cardStyle={styles.lightCard} // Shorten type casting
              titleStyle={{
                fontSize: ms(18),
                color: FBColorPalette.secondary,
              }}
              descriptionStyle={{
                fontSize: ms(10),
                marginTop: vs(5),
                fontWeight: 'bold',
                color: FBColorPalette.secondary,
              }}
            />
          </View>

          {/* refer now card*/}
          <Divider height={24} />
          <BusinessHomeCard />

          {/* bottom image cards*/}
          <Divider height={24} />
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: ms(5),
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <ImageCard
              imageSource={giftImage}
              title="Rewards"
              description="Play and Earn"
              cardStyle={styles.lightCard} // Shorten type casting
              titleStyle={{
                fontSize: ms(18),
                color: FBColorPalette.secondary,
              }}
              descriptionStyle={{
                fontSize: ms(10),
                marginTop: vs(5),
                fontWeight: 'bold',
                color: FBColorPalette.secondary,
              }}
            />
            <ImageCard
              imageSource={evImage}
              title="EV Charging"
              description="Charge your electric vehicles"
              cardStyle={styles.lightCard} // Shorten type casting
              titleStyle={{
                fontSize: ms(18),
                color: FBColorPalette.secondary,
              }}
              descriptionStyle={{
                fontSize: ms(10),
                marginTop: vs(5),
                fontWeight: 'bold',
                color: FBColorPalette.secondary,
              }}
            />
          </View>

          {/* for you decoration */}
          <Divider height={24} />
          <ForYouDecoration />

          {/* refer now card*/}
          <Divider height={24} />

          {/* bottom text */}
          <Divider height={24} />
          <Text
            lines={2}
            style={{fontSize: ms(60), paddingHorizontal: ms(5)}}
            color="complementary">
            Doorstep fuel delivery
          </Text>

          {/* footer text */}
          <Divider height={10} />
          <Text size="lg" color="darkGray" style={{textAlign: 'center'}}>
            ❤️ Gurugram, Haryana
          </Text>

          <Divider height={40} />
        </Container>
      </ScrollView>
    </GradientPrimary>
  );
};

const styles = ScaledSheet.create({
  body: {
    flex: '1@mvs',
    width: '100%',
    position: 'relative',
    marginTop: '4@vs',
  },
  image: {
    width: '310@s',
    height: '200@ms',
    marginVertical: '5@vs',
    borderRadius: '10@ms',
  },
  containerCenter: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightCard: {
    backgroundColor: FBColorPalette.white,
    color: FBColorPalette.secondary,
    borderColor: FBColorPalette.complementary,
    padding: 0,
    borderRadius: '20@ms',
    height: '190@vs',
    width: '140@ms',
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
});

export default HomeLandingPage;
