// dependencies
import {FlatList, View} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';

// components
import {Divider, HeaderAvoidingContainer} from '@/components';
import {BusinessListCard} from '../components/common';

// store
import {businessStore} from '@/globalStore';
import {WalletService} from '@/services';
import {FetchAllOrgUsersByTypeQuery} from '@/generated/graphql';

const BusinessListDelivery: React.FC = () => {
  const [displayOrgs, setDisplayOrgs] = useState<
    FetchAllOrgUsersByTypeQuery['organization_user']
  >([]);

  const deliveryBusinessOrgs = businessStore.use.deliveryBusinessOrgs();
  const deliveryBusinessIndividual =
    businessStore.use.deliveryBusinessIndividual();

  const ItemSeparatorComponent = useCallback(() => <Divider height={20} />, []);

  const fetchIndividualLedger = async () => {
    const individualUserLedger = await WalletService.getUserLedger({
      limit: 10,
      offset: 0,
      where: {
        organization_user_id: {
          _eq: deliveryBusinessIndividual?.id,
        },
      },
    });

    const orgsToShow = [...deliveryBusinessOrgs];

    if (individualUserLedger?.length > 0) {
      orgsToShow.unshift(
        deliveryBusinessIndividual as FetchAllOrgUsersByTypeQuery['organization_user'][0],
      );
    }

    setDisplayOrgs(orgsToShow);
  };

  useEffect(() => {
    fetchIndividualLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HeaderAvoidingContainer>
      <View style={{flex: 1}}>
        {/* {showIndividual ? (
          <BusinessListCard
            orgUser={
              deliveryBusinessIndividual as FetchAllOrgUsersByTypeQuery['organization_user'][0]
            }
          />
        ) : null} */}
        {deliveryBusinessOrgs.length ? (
          <FlatList
            data={displayOrgs}
            contentContainerStyle={{paddingBottom: 20}}
            renderItem={({item}) => <BusinessListCard orgUser={item} />}
            ItemSeparatorComponent={ItemSeparatorComponent}
            keyExtractor={item => item.id}
          />
        ) : null}
      </View>
    </HeaderAvoidingContainer>
  );
};

export default BusinessListDelivery;
