//dependencies
import React from 'react';
import {ScrollView} from 'react-native';
import {vs, ms} from 'react-native-size-matters';
//imports
import {Text as CustomText} from '@/components';
//styles
import {FBColors} from '@/types/styles';
//props
interface Props {
  assets: any;
}

const AssetsSummary: React.FC<Props> = ({assets}) => {
  return (
    <ScrollView>
      {Object.keys(assets).map(type => (
        <CustomText key={type} style={{fontSize: ms(12), marginTop: vs(3)}}>
          {type.toUpperCase()} -{' '}
          <CustomText
            style={{
              fontSize: ms(12),
              color: FBColors.complementary,
              textDecorationLine: 'underline',
            }}>
            {assets[type][0].plate}{' '}
            {assets[type].length > 1 && (
              <> + {assets[type].length - 1} more assets</>
            )}
          </CustomText>
        </CustomText>
      ))}
    </ScrollView>
  );
};

export default AssetsSummary;
