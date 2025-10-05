import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateDisplayName = (name) => {
    if (!name.trim()) {
      return 'Display name is required';
    }
    if (name.length > 50) {
      return 'Display name must be 50 characters or less';
    }
    return null;
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format';
    }
    return null;
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least 1 uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least 1 lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least 1 number';
    }
    return null;
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) {
      return null; // Phone is optional
    }
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
      return 'Invalid phone number format';
    }
    return null;
  };

  // Handle input changes with inline validation
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Validate field on blur
  const handleBlur = (field) => {
    let error = null;

    switch (field) {
      case 'displayName':
        error = validateDisplayName(formData.displayName);
        break;
      case 'email':
        error = validateEmail(formData.email);
        break;
      case 'password':
        error = validatePassword(formData.password);
        break;
      case 'phone':
        error = validatePhone(formData.phone);
        break;
    }

    if (error) {
      setErrors({ ...errors, [field]: error });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all fields
    const displayNameError = validateDisplayName(formData.displayName);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const phoneError = validatePhone(formData.phone);

    if (displayNameError || emailError || passwordError || phoneError) {
      setErrors({
        displayName: displayNameError,
        email: emailError,
        password: passwordError,
        phone: phoneError,
      });
      return;
    }

    setLoading(true);

    const result = await register(
      formData.displayName.trim(),
      formData.email.trim(),
      formData.password,
      formData.phone.trim() || null
    );

    setLoading(false);

    if (!result.success) {
      Alert.alert('Registration Failed', result.error);
    }
    // If successful, AuthContext will handle navigation via auth state change
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join NightSwipe to start connecting</Text>

        {/* Display Name Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={[styles.input, errors.displayName && styles.inputError]}
            value={formData.displayName}
            onChangeText={(value) => handleChange('displayName', value)}
            onBlur={() => handleBlur('displayName')}
            placeholder="Enter your name"
            placeholderTextColor="#666"
            autoCapitalize="words"
            maxLength={50}
          />
          {errors.displayName && (
            <Text style={styles.errorText}>{errors.displayName}</Text>
          )}
        </View>

        {/* Email Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            onBlur={() => handleBlur('email')}
            placeholder="your@email.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>

        {/* Password Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              onBlur={() => handleBlur('password')}
              placeholder="Minimum 8 characters"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
          <Text style={styles.hint}>
            Must include uppercase, lowercase, and number
          </Text>
        </View>

        {/* Phone Field (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone (Optional)</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            onBlur={() => handleBlur('phone')}
            placeholder="+1 (555) 123-4567"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
          />
          {errors.phone && (
            <Text style={styles.errorText}>{errors.phone}</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 4,
  },
  eyeText: {
    fontSize: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 6,
  },
  hint: {
    color: '#666',
    fontSize: 12,
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  linkText: {
    color: '#6200ee',
    fontSize: 14,
    fontWeight: '600',
  },
});
