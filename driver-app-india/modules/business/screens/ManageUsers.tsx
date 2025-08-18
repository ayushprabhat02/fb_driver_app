import React, {useEffect, useRef, useState} from 'react';
import {Dimensions, FlatList, Pressable, StyleSheet, View} from 'react-native';
import {Plus, DotsThreeVertical, User} from 'phosphor-react-native';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';

// components
import {
  Divider,
  FullScreenLoader,
  HeaderAvoidingContainer,
  SimpleBottomSheet,
  Text,
} from '@/components';
import {InviteUserForm} from '../components/ManageUsers';

// services
import {BusinessService} from '@/services';

// store
import {businessStore} from '@/globalStore';
import {FBBackground, FBColors} from '@/types/styles';
import {commonBottomSheetView} from '@/styles';
import {replaceNullValueInString} from '@/utils/general';

const ManageUsers: React.FC = () => {
  const currentOrgUserInView = businessStore.use.currentOrgUserInView();

  const [owners, setOwners] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<any[]>([]);

  const loaders = businessStore.use.loaders();
  const stopLoader = businessStore.use.stopLoader();
  const startLoader = businessStore.use.startLoader();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const openBottomSheet = () => {
    bottomSheetRef.current?.present();
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.dismiss();
  };

  useEffect(() => {
    if (currentOrgUserInView?.id) {
      startLoader('currentOrgUsersList');
      BusinessService.fetchUsersByOrgUserId(currentOrgUserInView.id)
        .then(response => {
          const filteredOwners = response.filter(
            (member: any) => member.role === 'owner',
          );

          setOwners(filteredOwners);

          const filteredUsers = response.filter((member: any) => {
            return member.role === 'user';
          });

          setUsers(filteredUsers);

          const disabled = response.filter((user: any) => {
            return !user.is_active;
          });
          setInactiveUsers(disabled);
        })
        .finally(() => {
          stopLoader('currentOrgUsersList');
        });
    }

    return () => {
      setTimeout(() => {
        startLoader('currentOrgUsersList');
      }, 1000);
      businessStore.setState(state => ({
        ...state,
        currentOrgUsersList: [],
      }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrgUserInView]);

  return (
    <HeaderAvoidingContainer>
      <View style={{flex: 1}}>
        {!loaders?.currentOrgUsersList ? (
          <>
            <View>
              <Text size="lg" weight="600">
                Owners
              </Text>
              <Divider />
              {owners.length ? (
                <View>
                  <FlatList
                    horizontal={false}
                    data={owners.filter(owner => owner?.is_active)}
                    numColumns={2}
                    columnWrapperStyle={{justifyContent: 'space-between'}}
                    contentContainerStyle={{rowGap: 16}}
                    renderItem={({item}) => (
                      <UserCard
                        user={item}
                        setInactiveUsers={setInactiveUsers}
                        setOwners={setOwners}
                        setUsers={setUsers}
                      />
                    )}
                  />
                </View>
              ) : (
                <View>
                  <Text size="xs" color="disabledInputText">
                    No owners available
                  </Text>
                </View>
              )}
            </View>
            <Divider height={20} />
            <View>
              <Text size="lg" weight="600">
                Users
              </Text>
              <Divider />
              {users.length ? (
                <FlatList
                  horizontal={false}
                  data={users.filter(user => user?.is_active)}
                  numColumns={2}
                  columnWrapperStyle={{justifyContent: 'space-between'}}
                  contentContainerStyle={{rowGap: 16}}
                  renderItem={({item}) => (
                    <UserCard
                      user={item}
                      setInactiveUsers={setInactiveUsers}
                      setOwners={setOwners}
                      setUsers={setUsers}
                    />
                  )}
                />
              ) : (
                <View>
                  <Text size="xs" color="disabledInputText">
                    No users available
                  </Text>
                </View>
              )}
            </View>
            {inactiveUsers?.length ? (
              <View>
                <Divider height={20} />
                <Text size="lg" weight="600">
                  Inactive Members
                </Text>
                <Divider />
                <FlatList
                  horizontal={false}
                  data={inactiveUsers}
                  numColumns={2}
                  columnWrapperStyle={{justifyContent: 'space-between'}}
                  contentContainerStyle={{rowGap: 16}}
                  renderItem={({item}) => (
                    <UserCard
                      user={item}
                      setInactiveUsers={setInactiveUsers}
                      setOwners={setOwners}
                      setUsers={setUsers}
                    />
                  )}
                />
              </View>
            ) : null}
          </>
        ) : null}
        <Divider />
      </View>
      <Pressable onPress={openBottomSheet} style={styles.inviteUserButton}>
        <Plus color={FBColors.white} weight="bold" size={32} />
      </Pressable>
      <SimpleBottomSheet
        ref={bottomSheetRef}
        closeSheet={closeBottomSheet}
        snapPoints={['90%']}>
        <BottomSheetView style={commonBottomSheetView}>
          <InviteUserForm closeSheet={closeBottomSheet} />
        </BottomSheetView>
      </SimpleBottomSheet>
      <FullScreenLoader
        showLoader={loaders.currentOrgUsersList}
        loaderText="Please wait"
      />
    </HeaderAvoidingContainer>
  );
};

type UserProp = {
  user: any;
  setOwners: (owners: any) => void;
  setUsers: (users: any) => void;
  setInactiveUsers: (users: any) => void;
};

const UserCard: React.FC<UserProp> = ({
  user,
  setOwners,
  setInactiveUsers,
  setUsers,
}) => {
  const currentOrgUserInView = businessStore.use.currentOrgUserInView();

  const [loading, setLoading] = useState<boolean>(false);
  const stopLoader = businessStore.use.stopLoader();
  const startLoader = businessStore.use.startLoader();
  const handleRemoveUser = async () => {
    startLoader('currentOrgUsersList');
    setLoading(true);
    try {
      await BusinessService.removeUser({
        organization_user_id: user?.organization_user_id,
        isActive: false,
      });

      if (currentOrgUserInView?.id) {
        startLoader('currentOrgUsersList');
        BusinessService.fetchUsersByOrgUserId(currentOrgUserInView.id)
          .finally(() => {
            stopLoader('currentOrgUsersList');
          })
          .then(response => {
            const filteredOwners = response.filter(
              (member: any) => member.role === 'owner',
            );

            setOwners(filteredOwners);

            const filteredUsers = response.filter((member: any) => {
              return member.role === 'user';
            });

            setUsers(filteredUsers);

            const disabled = response.filter((user: any) => {
              return !user?.is_active;
            });
            setInactiveUsers(disabled);
          });
      }
    } catch (error) {
      console.error('Error removing user:', error);
    } finally {
      setTimeout(() => {
        stopLoader('currentOrgUsersList');
        setLoading(false);
      }, 3000);
    }
  };

  const activateUser = async () => {
    startLoader('currentOrgUsersList');
    setLoading(true);
    try {
      await BusinessService.removeUser({
        organization_user_id: user?.organization_user_id,
        isActive: true,
      });

      if (currentOrgUserInView?.id) {
        startLoader('currentOrgUsersList');
        BusinessService.fetchUsersByOrgUserId(currentOrgUserInView.id)
          .finally(() => {
            stopLoader('currentOrgUsersList');
          })
          .then(response => {
            const filteredOwners = response.filter(
              (member: any) => member.role === 'owner',
            );

            setOwners(filteredOwners);

            const filteredUsers = response.filter((member: any) => {
              return member.role === 'user';
            });

            setUsers(filteredUsers);

            const disabled = response.filter((user: any) => {
              return !user?.is_active;
            });
            setInactiveUsers(disabled);
          });
      }
    } catch (error) {
      console.error('Error removing user:', error);
    } finally {
      setTimeout(() => {
        stopLoader('currentOrgUsersList');
        setLoading(false);
      }, 3000);
    }
  };

  return (
    <View style={styles.card}>
      <User weight="fill" size={20} />
      <Text size="sm" lines={1} style={{width: '60%'}}>
        {replaceNullValueInString(user?.name)}
      </Text>
      {!user?.is_owner ? (
        <Menu>
          <MenuTrigger>
            <DotsThreeVertical weight="bold" size={20} />
          </MenuTrigger>
          <MenuOptions customStyles={slideInMenuStyles}>
            {user?.is_active ? (
              <MenuOption onSelect={handleRemoveUser} disabled={loading}>
                <Text style={styles.menuText}>Remove User</Text>
              </MenuOption>
            ) : (
              <MenuOption onSelect={activateUser} disabled={loading}>
                <Text style={styles.menuText}>Activate User</Text>
              </MenuOption>
            )}
          </MenuOptions>
        </Menu>
      ) : null}
    </View>
  );
};

export default ManageUsers;

const styles = StyleSheet.create({
  inviteUserButton: {
    backgroundColor: FBBackground.active,
    position: 'absolute',
    bottom: 50,
    right: 50,
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  card: {
    width: Dimensions.get('window').width / 2 - 20,
    height: 60,
    borderWidth: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  menuText: {
    fontSize: 12,
  },
});

const slideInMenuStyles = {
  optionsContainer: {
    width: 150,
    padding: 10,
    borderRadius: 8,
    backgroundColor: FBBackground.white,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    transform: [{translateX: 100}],
    transition: 'transform 0.3s ease-in-out',
  },
  optionWrapper: {
    padding: 10,
  },
  optionText: {
    fontSize: 14,
    color: 'black',
  },
};
