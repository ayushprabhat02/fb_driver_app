import {Keyboard, Pressable, TextInput, View} from 'react-native';
import React, {useCallback, useEffect, useRef} from 'react';
import {MagnifyingGlass} from 'phosphor-react-native';
import {commonInputStyles} from '@/styles';
import {FBColors} from '@/types/styles';
import {OrderService} from '@/services';
import {debounce} from 'lodash';
import {orderStore} from '@/globalStore';
// import {useFocusEffect} from '@react-navigation/native';
import {XCircle} from 'phosphor-react-native';
import {Customer_Order_State_Enum} from '@/generated/graphql';

type Props = {
  orderCode: string;
  setOrderCode: React.Dispatch<React.SetStateAction<string>>;
};

const OrderSearchBar: React.FC<Props> = ({orderCode, setOrderCode}) => {
  const currentOrdersInViewClone = orderStore.use.currentOrdersInViewClone();

  const inputRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearchByOrderCode = useCallback(
    debounce((code: string) => {
      OrderService.fetchCustomerOrderDetailsByCode({
        order_code: code,
        state: [
          Customer_Order_State_Enum.Confirmed,
          Customer_Order_State_Enum.NoShow,
          Customer_Order_State_Enum.Declined,
          Customer_Order_State_Enum.Pending,
          Customer_Order_State_Enum.SettlementDone,
        ],
      })
        .then(response => {
          if (response.length) {
            orderStore.setState(state => ({
              ...state,
              currentOrdersInView: response,
            }));
          } else {
            orderStore.setState(state => ({
              ...state,
              currentOrdersInView: currentOrdersInViewClone,
            }));
          }
        })
        .catch(error => {
          console.log('error searching by code', error);
        });
    }, 1000),
    [currentOrdersInViewClone],
  );

  const searchOrderByCode = (code: string) => {
    setOrderCode(code);
    if (code) {
      debouncedSearchByOrderCode(code);
    } else {
      orderStore.setState(state => ({
        ...state,
        currentOrdersInView: currentOrdersInViewClone,
      }));
    }
  };

  const onClear = () => {
    setOrderCode('');
    orderStore.setState(state => ({
      ...state,
      currentOrdersInView: currentOrdersInViewClone,
    }));
  };

  useEffect(() => {
    // Listen for keyboard hide event and blur the input
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      inputRef.current?.blur();
    });

    // Cleanup listener on component unmount
    return () => {
      keyboardHideListener.remove();
    };
  }, []);

  return (
    <View
      style={{
        ...commonInputStyles,
        height: 40,
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
      }}>
      <MagnifyingGlass size={20} color={FBColors.steelBlue} />
      <TextInput
        ref={inputRef}
        maxLength={6}
        value={orderCode}
        onChangeText={searchOrderByCode}
        placeholder="Enter order code"
        placeholderTextColor={FBColors.placeHolderPrimary}
        style={{
          fontSize: 16,
          color: FBColors.steelBlue,
          width: '85%',
          paddingVertical: 0,
        }}
        keyboardType="numeric"
      />
      {orderCode ? (
        <Pressable onPress={onClear} style={{position: 'absolute', right: 10}}>
          <XCircle color={FBColors.steelBlue} weight="light" />
        </Pressable>
      ) : null}
    </View>
  );
};

export default OrderSearchBar;
