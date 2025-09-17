// dependencies
import {Keyboard, Pressable, StyleSheet, TextInput, View} from 'react-native';
import React, {useState} from 'react';
import {commonInputStyles} from '@/styles';
import {z} from 'zod'; // <-- Added Zod import here

// store
import {authStore} from '@/globalStore';

// components
import {Text, Button, Divider} from '@/components';
import LoginFormHeading from './LoginHeading';
import {Eye, EyeSlash} from 'phosphor-react-native';

// types
import {FBColors} from '@/types/styles';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

// Service
import {signInWithEmailPass} from '../services';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';

// --- Schema and Type Definition ---
// The login schema is now defined directly in this file.
const loginSchema = z.object({
  email: z
    .string({required_error: 'Email is required'})
    .email('Please enter a valid email address'),
  password: z
    .string({required_error: 'Password is required'})
    .min(6, 'Password must be at least 6 characters long'),
});

// The form fields type is inferred from the schema.
type LoginFormFields = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const isLoading = authStore.use.loaders().auth;
  const loader = authStore.use.loaders();
  const [confirmationResult, setConfirmationResult] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);
  const stopLoader = authStore.use.stopLoader();
  const startLoader = authStore.use.startLoader();

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<LoginFormFields>({
    mode: 'onBlur',
    resolver: zodResolver(loginSchema), // Uses the schema defined above
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Submit function that calls the auth service
  const onLoginSubmit = async (data: LoginFormFields) => {
    startLoader('auth');

    signInWithEmailPass(data.email, data.password)
      .then(result => {
        setConfirmationResult(result);
      })
      .catch(error => {
        console.error('Login error:', error);
      })
      .finally(() => {
        stopLoader('auth');
      });
  };

  return (
    <View style={styles.container}>
      <LoginFormHeading />
      <Divider height={24} />

      {/* Email Input */}
      <Controller
        control={control}
        name="email"
        render={({field: {onChange, onBlur, value}}) => (
          <View style={styles.inputWrapper}>
            <Text size="sm" color="steelBlue" weight="500">
              Email <Text color="error">*</Text>
            </Text>
            <Divider height={4} />
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={[styles.inputStyle, errors.email && styles.errorBorder]}
              placeholder="Enter your email"
              placeholderTextColor={FBColors.placeHolderPrimary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>
        )}
      />

      <Divider height={16} />

      {/* Password Input */}
      <Controller
        control={control}
        name="password"
        render={({field: {onChange, onBlur, value}}) => (
          <View style={styles.inputWrapper}>
            <Text size="sm" color="steelBlue" weight="500">
              Password <Text color="error">*</Text>
            </Text>
            <Divider height={4} />
            <View
              style={[
                styles.passwordContainer,
                errors.password && styles.errorBorder,
              ]}>
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor={FBColors.placeHolderPrimary}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}>
                {showPassword ? (
                  <EyeSlash
                    size={20}
                    color={FBColors.neutral}
                    weight="regular"
                  />
                ) : (
                  <Eye
                    size={20}
                    color={FBColors.neutral}
                    weight="regular"
                  />
                )}
              </Pressable>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>
        )}
      />

      <Divider height={24} />

      <Button
        disabled={isLoading}
        variant="solid"
        style={{width: '100%'}}
        onPress={handleSubmit(onLoginSubmit)}>
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </View>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 32,
    flex: 1,
  },
  inputWrapper: {
    width: '100%',
  },
  inputStyle: {
    ...commonInputStyles,
    height: 50,
    fontSize: 14,
    fontWeight: '400',
    width: '100%',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderRadius: commonInputStyles.borderRadius || 8,
    borderWidth: commonInputStyles.borderWidth || 1,
    borderColor: commonInputStyles.borderColor || '#ccc',
    backgroundColor: commonInputStyles.backgroundColor || '#f0f0f0',
    paddingHorizontal: commonInputStyles.paddingHorizontal || 12,
  },
  passwordInput: {
    flex: 1,
    color: FBColors.neutral,
    fontSize: 14,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  errorBorder: {
    borderColor: 'red',
  },
});
