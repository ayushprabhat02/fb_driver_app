import React from 'react';
import {View, Image, ImageSourcePropType} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// components
import Text from '../Text';

type Props = {
  imageSource: ImageSourcePropType;
  title: string;
  description: string;
  titleStyle: any;
  descriptionStyle: any;
  cardStyle: any;
};

const ImageCard: React.FC<Props> = ({
  imageSource,
  title,
  description,
  titleStyle,
  descriptionStyle,
  cardStyle,
}) => {
  return (
    <View style={[styles.cardContainer, cardStyle]}>
      <View style={styles.textOverlay}>
        <Text color="white" weight="bold" size="lg" style={titleStyle}>
          {title}
        </Text>
        <Text color="white" weight="bold" size="lg" style={descriptionStyle}>
          {description}
        </Text>
      </View>
      <Image source={imageSource} style={styles.bottomImage} />
    </View>
  );
};

const styles = ScaledSheet.create({
  cardContainer: {
    // Dimensions and other overall card styles
    width: '145@s',
    height: '145@s',
    borderRadius: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bottomImage: {
    height: '45%',
    width: '100%',
  },
  textOverlay: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  description: {
    color: 'white',
  },
});

export default ImageCard;
