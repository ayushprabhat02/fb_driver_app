import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation, useRoute} from '@react-navigation/native';

// Components
import {HeaderAvoidingContainer, Text, Divider} from '@/components';

// Services
import fillupService from '../services';

// Store
import fillupStore from '../store';

// Types & Enums
import {
  Fillup_Request_Status_Enum,
  Fuel_Request_Type_Enum,
} from '@/generated/graphql';

// Utils
import {FBColors, FBBackground} from '@/types/styles';

// Icons
import {MapPin, NavigationArrow} from 'phosphor-react-native';

interface RouteParams {
  fillupId: string;
}

const FillupDetails: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {fillupId} = route.params as RouteParams;

  const [navigationLoading, setNavigationLoading] = useState(false);

  const fillupDetails = fillupStore.use.fillupRequestDetails();

  console.log('----fillupDetails-----', fillupDetails);

  // Debug location availability
  useEffect(() => {
    if (fillupDetails) {
      console.log('=== LOCATION DEBUG ===');
      console.log(
        'task?.partner_address?.location:',
        fillupDetails.task?.partner_address?.location,
      );
      console.log(
        'partner_order?.partner_address?.location:',
        fillupDetails.partner_order?.partner_address?.location,
      );
      console.log(
        'partner_order?.partner_user?.partner?.location:',
        fillupDetails.partner_order?.partner_user?.partner?.location,
      );
      console.log(
        'task?.fillup_requests?.[0]?.driver_vehicle?.vehicle?.partner_address?.location:',
        fillupDetails.task?.fillup_requests?.[0]?.driver_vehicle?.vehicle
          ?.partner_address?.location,
      );
      console.log(
        'task?.fillup_requests?.[0]?.driver_vehicle?.vehicle?.location:',
        fillupDetails.task?.fillup_requests?.[0]?.driver_vehicle?.vehicle
          ?.location,
      );
      console.log('=== END LOCATION DEBUG ===');
    }
  }, [fillupDetails]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        await fillupService.fetchFillupRequestById({id: fillupId});
      } catch (error) {
        console.error('Failed to fetch fillup details:', error);
        Alert.alert('Error', 'Failed to load fillup details');
      }
    };

    fetchDetails();
  }, [fillupId]);

  const getPartnerLocation = () => {
    if (!fillupDetails) {
      return null;
    }

    try {
      // Priority 1: task partner address location (string format) - Vue.js primary
      if (fillupDetails.task?.partner_address?.location) {
        const locationString = fillupDetails.task.partner_address.location;
        // Vue.js format: "lat,lng" with parentheses to remove
        const formattedLocation = locationString.replace(/[()]/g, '');
        const coords = formattedLocation.split(',');
        return {
          lat: parseFloat(coords[0]),
          lng: parseFloat(coords[1]),
        };
      }

      // Priority 2: partner order address location (string format)
      if (fillupDetails.partner_order?.partner_address?.location) {
        const locationString =
          fillupDetails.partner_order.partner_address.location;
        const formattedLocation = locationString.replace(/[()]/g, '');
        const coords = formattedLocation.split(',');
        return {
          lat: parseFloat(coords[0]),
          lng: parseFloat(coords[1]),
        };
      }

      // Priority 3: partner user partner location (object format with coordinates array)
      if (
        fillupDetails.partner_order?.partner_user?.partner?.location
          ?.coordinates
      ) {
        const coordinates =
          fillupDetails.partner_order.partner_user.partner.location.coordinates;
        // Vue.js format: coordinates[1] = lat, coordinates[0] = lng
        return {
          lat: coordinates[1],
          lng: coordinates[0],
        };
      }

      console.warn('No location found in any of the expected fields');
      return null;
    } catch (error) {
      console.error('Error getting partner location:', error);
      return null;
    }
  };

  const getPartnerName = () => {
    if (!fillupDetails) {
      return 'Unknown Partner';
    }

    // Try partner order name
    if (fillupDetails.partner_order?.partner_user?.partner?.name) {
      return fillupDetails.partner_order.partner_user.partner.name;
    }

    // Try driver name
    if (fillupDetails.task?.fillup_requests?.[0]?.driver_vehicle?.user) {
      const user = fillupDetails.task.fillup_requests[0].driver_vehicle.user;
      return `${user.first_name || ''} ${user.middle_name || ''} ${
        user.last_name || ''
      }`.trim();
    }

    // Try partner address name
    if (fillupDetails.partner_order?.partner_address?.name) {
      return fillupDetails.partner_order.partner_address.name;
    }

    return 'Unknown Partner';
  };

  const getPartnerAddress = () => {
    if (!fillupDetails) {
      return 'Address not available';
    }

    // First check for partner about (priority 1)
    if (fillupDetails.partner_order?.partner_user?.partner?.about) {
      return fillupDetails.partner_order.partner_user.partner.about;
    }

    // Build address from components (priority 2) - exact Vue.js logic
    let addressParts = [];

    // House number
    const houseNumber =
      fillupDetails.task?.partner_address?.house_number ||
      fillupDetails.partner_order?.partner_address?.house_number;
    if (houseNumber) {
      addressParts.push(houseNumber);
    }

    // Street address
    const streetAddress =
      fillupDetails.task?.partner_address?.street_address ||
      fillupDetails.partner_order?.partner_address?.street_address;
    if (streetAddress) {
      addressParts.push(streetAddress);
    }

    // Landmark
    const landmark =
      fillupDetails.task?.partner_address?.landMark ||
      fillupDetails.partner_order?.partner_address?.landMark;
    if (landmark) {
      addressParts.push(landmark);
    }

    // Address line 1
    const addressLine1 =
      fillupDetails.task?.partner_address?.address_line1 ||
      fillupDetails.partner_order?.partner_address?.address_line1;
    if (addressLine1) {
      addressParts.push(addressLine1);
    }

    // Pincode
    const pincode =
      fillupDetails.task?.partner_address?.pincode ||
      fillupDetails.partner_order?.partner_address?.pincode;
    if (pincode) {
      addressParts.push(pincode);
    }

    // Address line 2
    const addressLine2 =
      fillupDetails.task?.partner_address?.address_line2 ||
      fillupDetails.partner_order?.partner_address?.address_line2;
    if (addressLine2) {
      addressParts.push(addressLine2);
    }

    return addressParts.length > 0
      ? addressParts.join(', ')
      : 'Address not available';
  };

  const getFuelType = () => {
    return (
      fillupDetails?.task?.fillup_requests?.[0]
        ?.vehicle_tank_type_product_variation?.product_variation?.product
        ?.name ||
      fillupDetails?.partner_order?.fillup_requests?.[0]
        ?.vehicle_tank_type_product_variation?.product_variation?.product
        ?.name ||
      'Unknown'
    );
  };

  const getApprovedQuantity = () => {
    return (
      fillupDetails?.task?.fillup_requests?.[0]?.quantity_approved ||
      fillupDetails?.partner_order?.fillup_requests?.[0]?.quantity_approved ||
      fillupDetails?.quantity_approved ||
      '0'
    );
  };

  const getTankType = () => {
    return (
      fillupDetails?.task?.fillup_requests?.[0]
        ?.vehicle_tank_type_product_variation?.vehicle_tank_type?.tank_type
        ?.name ||
      fillupDetails?.partner_order?.fillup_requests?.[0]
        ?.vehicle_tank_type_product_variation?.vehicle_tank_type?.tank_type
        ?.name ||
      'Unknown'
    );
  };

  const openExternalNavigation = () => {
    const destination = getPartnerLocation();

    if (!destination || !destination.lat || !destination.lng) {
      Alert.alert('Error', 'Partner location not available for navigation');
      return;
    }

    setNavigationLoading(true);

    const scheme = Platform.select({
      ios: `maps://maps.apple.com/?q=${destination.lat},${destination.lng}&t=m&dirflg=d`,
      android: `https://www.google.com/maps/dir/?api=1&dir_action=navigate&travelmode=driving&destination=${destination.lat},${destination.lng}`,
    });

    if (scheme) {
      Linking.openURL(scheme)
        .catch(err => {
          console.error('Error opening maps:', err);
          Alert.alert('Error', 'Could not open navigation app');
        })
        .finally(() => {
          setNavigationLoading(false);
        });
    }
  };

  const handleIHaveReached = async () => {
    if (!fillupDetails) {
      return;
    }

    try {
      setNavigationLoading(true);

      // Update fillup request state to AUTHORIZED when driver reaches the location
      await fillupService.updateFillupRequestState({
        id: fillupDetails.id,
        state: Fillup_Request_Status_Enum.Authorized,
      });

      // Refresh fillup details to get updated state
      await fillupService.fetchFillupRequestById({id: fillupDetails.id});

      // Navigate based on updated state - similar to Vue.js openSteps function

      switch (Fillup_Request_Status_Enum.Authorized) {
        case Fillup_Request_Status_Enum.Authorized:
        case 'ELOCKING_OPEN_REQUEST':
        case 'ELOCKING_OPEN_REQUEST_APPROVED':
        case 'AWAITING_INDENT_UPLOAD_AUTHORIZATION':
        case 'INDENT_UPLOAD_AUTHORIZED':
        case 'PURCHASE_INVOICE_REQUEST':
        case 'PURCHASE_RECEIPT_REQUEST':
        case 'INDENT_UPLOAD_REJECTED':
          // Navigate to indent upload screen
          // @ts-ignore
          navigation.navigate('address', {
            screen: 'fillup-indent',
            params: {fillupId: fillupDetails.id},
          });
          break;

        default:
          Alert.alert('Info', 'Proceeding to next step...');
      }
    } catch (error) {
      console.error('Error in I Have Reached:', error);
      Alert.alert('Error', 'Failed to update fillup state. Please try again.');
    } finally {
      setNavigationLoading(false);
    }
  };

  const canShowActionButton = () => {
    if (!fillupDetails) {
      return false;
    }
    return (
      fillupDetails.partner_order ||
      fillupDetails.fuel_request_type === Fuel_Request_Type_Enum.FuelTank
    );
  };

  const isApprovedState = () => {
    return (
      fillupDetails?.state === 'APPROVED' ||
      fillupDetails?.state === Fillup_Request_Status_Enum.Approved
    );
  };

  const handleContinue = () => {
    if (!fillupDetails) {
      return;
    }

    try {
      setNavigationLoading(true);

      // Navigate to fillup indent upload page
      // @ts-ignore
      navigation.navigate('address', {
        screen: 'fillup-indent',
        params: {fillupId: fillupDetails.id},
      });
    } catch (error) {
      console.error('Error in Continue:', error);
      Alert.alert('Error', 'Failed to navigate. Please try again.');
    } finally {
      setNavigationLoading(false);
    }
  };

  // if (loading || fillupLoaders.fetchFillupRequestById) {
  //   return (
  //     <FullScreenLoader
  //       showLoader={true}
  //       loaderText="Loading fillup details..."
  //     />
  //   );
  // }

  if (!fillupDetails) {
    return (
      <HeaderAvoidingContainer>
        <View style={styles.errorContainer}>
          <Text size="lg" weight="bold" color="error">
            Fillup details not found
          </Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}>
            <Text size="base" weight="bold" color="white">
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </HeaderAvoidingContainer>
    );
  }

  return (
    <HeaderAvoidingContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Partner Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text size="base" weight="bold" color="neutral">
              Partner Information
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text size="sm" weight="bold" color="steelBlue">
              Name:
            </Text>
            <Text size="sm" color="neutral" style={{marginLeft: 8, flex: 1}}>
              {getPartnerName()}
            </Text>
          </View>

          <View style={styles.infoColumn}>
            <Text size="sm" weight="bold" color="steelBlue">
              Fillup Pump Location:
            </Text>
            <Text
              size="sm"
              color="neutral"
              style={{marginTop: 4, lineHeight: 18}}>
              {getPartnerAddress()}
            </Text>
          </View>
        </View>

        <Divider height={1} />

        {/* Fuel Details */}
        <View style={styles.section}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text size="sm" weight="bold" color="steelBlue">
                Fuel Type
              </Text>
              <Text size="sm" color="neutral">
                {getFuelType()}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text size="sm" weight="bold" color="steelBlue">
                Approved Quantity
              </Text>
              <Text size="sm" color="neutral">
                {getApprovedQuantity()} litres
              </Text>
            </View>
          </View>
        </View>

        <Divider height={1} />

        {/* Tank Details */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text size="sm" weight="bold" color="steelBlue">
              Tank Type:
            </Text>
            <Text size="sm" color="neutral" style={{marginLeft: 8, flex: 1}}>
              {getTankType()}
            </Text>
          </View>
        </View>

        <Divider height={1} />

        {/* Navigation Info */}
        <View style={styles.navigationInfo}>
          <View style={styles.navigationHeader}>
            <MapPin size={20} color={FBColors.primary} />
            <Text
              size="sm"
              color="steelBlue"
              style={{marginLeft: 8, lineHeight: 18, marginBottom: 4}}>
              • Tap "Navigate" to open maps for turn-by-turn directions
            </Text>
          </View>
          <Text
            size="sm"
            color="steelBlue"
            style={{marginLeft: 8, lineHeight: 18, marginBottom: 4}}>
            • Follow GPS directions to reach the fillup location
          </Text>
          <Text
            size="sm"
            color="steelBlue"
            style={{marginLeft: 8, lineHeight: 18, marginBottom: 4}}>
            • Contact partner if you need assistance finding the location
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons - Conditional based on state */}
      {canShowActionButton() ? (
        isApprovedState() ? (
          // Show Navigate and "I Have Reached" buttons for APPROVED state
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.navigateButton]}
              onPress={openExternalNavigation}
              disabled={navigationLoading}>
              <NavigationArrow
                size={20}
                color={FBColors.white}
                style={styles.buttonIcon}
              />
              <Text size="base" weight="bold" color="white">
                {navigationLoading ? 'Opening Maps...' : 'Navigate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.reachedButton]}
              onPress={handleIHaveReached}
              disabled={navigationLoading}>
              <Text size="base" weight="bold" color="white">
                I Have Reached
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Show Continue button for other states
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.continueButton]}
              onPress={handleContinue}
              disabled={navigationLoading}>
              <Text size="base" weight="bold" color="white">
                {navigationLoading ? 'Loading...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <View style={styles.waitingContainer}>
          <Text
            size="base"
            weight="bold"
            color="error"
            style={{textAlign: 'center', marginBottom: 4}}>
            Request Approved.
          </Text>
          <Text
            size="base"
            weight="bold"
            color="error"
            style={{textAlign: 'center', marginBottom: 4}}>
            Please wait for further instructions.
          </Text>
        </View>
      )}
    </HeaderAvoidingContainer>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBBackground.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20@s',
  },
  goBackButton: {
    marginTop: '20@vs',
    paddingHorizontal: '40@s',
    paddingVertical: '12@vs',
    backgroundColor: FBColors.primary,
    borderRadius: '8@s',
    alignItems: 'center',
  },
  section: {
    padding: '16@s',
  },
  sectionHeader: {
    marginBottom: '12@vs',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  infoColumn: {
    marginBottom: '8@vs',
  },
  infoValue: {
    marginLeft: '8@s',
    flex: 1,
  },
  locationText: {
    marginTop: '4@vs',
    lineHeight: '18@vs',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    marginRight: '8@s',
  },
  navigationInfo: {
    backgroundColor: '#FEF3C7',
    margin: '16@s',
    padding: '16@s',
    borderRadius: '8@s',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  navigationText: {
    marginLeft: '8@s',
    lineHeight: '18@vs',
    marginBottom: '4@vs',
  },
  actionContainer: {
    padding: '16@s',
    backgroundColor: FBBackground.white,
    borderTopWidth: 1,
    borderTopColor: FBColors.lightGray,
    flexDirection: 'row',
    gap: '12@s',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '12@vs',
    paddingHorizontal: '16@s',
    borderRadius: '8@s',
    minHeight: '48@vs',
  },
  navigateButton: {
    backgroundColor: FBColors.primary,
  },
  reachedButton: {
    backgroundColor: '#374151', // Dark gray color like in Vue project
  },
  continueButton: {
    backgroundColor: '#16A34A', // Green color for continue button
  },
  buttonIcon: {
    marginRight: '8@s',
  },
  waitingContainer: {
    padding: '20@s',
    alignItems: 'center',
    backgroundColor: FBBackground.white,
    borderTopWidth: 1,
    borderTopColor: FBColors.lightGray,
  },
  centerText: {
    textAlign: 'center',
    marginBottom: '4@vs',
  },
});

export default FillupDetails;
