/**
 * Component not being used anywhere
 * ! Delete it
 */

import React from 'react';
import {
  View,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import Cross from 'react-native-vector-icons/MaterialIcons';
import {s, vs, ScaledSheet} from 'react-native-size-matters';

//types
import {FBBorders, FBBackground, FBColorPalette} from '@/types/styles';
import {CardElevated, Text} from '@/components';

interface CardProps {
  variant?: 'square' | 'reactangle';
  layout?: 'vertical' | 'horizontal';
  image?: ImageSourcePropType;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  onButtonPress?: () => void;
  cardStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  titleStyle?: TextStyle;
  contentStyle?: ViewStyle;
  textContentStyle?: ViewStyle;
  descriptionStyle?: TextStyle;
  descriptionNonHighlightStyle?: TextStyle;
  descriptionHighlightStyle?: TextStyle;
  children?: React.ReactNode | React.JSX.Element;
  childrenStyle?: ViewStyle;
}

const HeroCard: React.FC<CardProps> = ({
  variant = 'rectangle',
  layout = 'horizontal',
  image,
  title,
  description,
  showCloseButton = false,
  children,
  onButtonPress,
  cardStyle,
  imageStyle,
  titleStyle,
  contentStyle,
  descriptionStyle,
  childrenStyle,
  textContentStyle,
  descriptionNonHighlightStyle,
  descriptionHighlightStyle,
}) => {
  const getLayout = (): ViewStyle => {
    switch (layout) {
      case 'vertical':
        return {flexDirection: 'column'};
      default:
        return {flexDirection: 'row'};
    }
  };

  const getVariant = (): ViewStyle => {
    switch (variant) {
      case 'square':
        return {
          height: vs(160),
          width: s(160),
        };
      default:
        return {height: vs(200), width: '95%'};
    }
  };

  return (
    <CardElevated
      cardStyle={[styles.card, getLayout(), getVariant(), cardStyle] as any}>
      {showCloseButton && (
        <Cross
          onPress={() => {
            onButtonPress && onButtonPress();
          }}
          style={{position: 'absolute', top: 25, right: 15}}
          name="close"
          color={FBColorPalette.black}
          size={s(20)}
        />
      )}
      <View style={[styles.content, contentStyle]}>
        <View style={[styles.textContent, textContentStyle]}>
          <Text weight="bold" size="2xl" style={titleStyle}>
            {title}
          </Text>
          {description && (
            <Text size="base" style={descriptionStyle} lines={3}>
              <Text style={descriptionNonHighlightStyle}>
                {description.split('<sep>')[0]}{' '}
              </Text>
              {description.includes('<sep>') && (
                <Text style={descriptionHighlightStyle}>
                  {description.split('<sep>')[1].split('</sep>')}
                </Text>
              )}
            </Text>
          )}
        </View>
        {image && <Image source={image} style={[styles.image, imageStyle]} />}
      </View>
      <View style={[childrenStyle]}>{children}</View>
    </CardElevated>
  );
};

const styles = ScaledSheet.create({
  // Default styles
  card: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: FBBackground.primary,
    borderRadius: '20@ms',
    borderColor: FBBorders.primary,
    padding: '10@ms',
    margin: '10@ms',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOpacity: '0.2@ms',
        shadowRadius: '3@ms',
        shadowOffset: {width: s(2), height: vs(2)},
      },
      android: {
        elevation: 3,
      },
    }),
  },
  image: {
    width: '30%',
    height: '100%',
  },
  content: {
    height: '60%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContent: {
    flex: '1@ms',
    flexDirection: 'column',
  },

  description: {
    fontSize: '18@ms',
  },
});

export default HeroCard;
