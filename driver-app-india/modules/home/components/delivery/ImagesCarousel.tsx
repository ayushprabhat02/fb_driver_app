import React from 'react';
import {Dimensions, Image, View} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {ms, ScaledSheet} from 'react-native-size-matters';

const {width} = Dimensions.get('window');

const ImagesCarousel: React.FC = () => {
  const images = [
    require('@/assets/delivery/APP-BANNER-1.jpg'),
    require('@/assets/delivery/APP-BANNER-2.jpg'),
    require('@/assets/delivery/APP-BANNER-3.jpg'),
  ];
  const carouselRef = React.useRef<any>(null);

  const renderItem = ({item}: any) => (
    <View style={styles.imageContainer}>
      <Image source={item} style={styles.image} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Carousel
        height={width / 3}
        autoPlay
        autoPlayInterval={4000}
        width={width - ms(20)}
        ref={carouselRef}
        data={images}
        renderItem={renderItem}
        loop={true}
        style={styles.carousel}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 20,
  },
  carousel: {
    borderRadius: ms(20),
  },
  imageContainer: {
    padding: ms(10),
    borderRadius: 20,
  },
  image: {
    height: width / 3 - ms(20),
    width: width - ms(40),
    borderRadius: 20,
    resizeMode: 'cover',
  },
});

export default ImagesCarousel;
