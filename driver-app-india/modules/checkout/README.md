# Checkout Module

This module implements the checkout flow for the FuelBuddy driver app, following the same pattern as the checkin flow but with functionality matching the Vue.js project's checkout page.

## Structure

```
checkout/
├── graphql/          # GraphQL queries and mutations
├── screens/          # Screen components
├── services/         # Business logic and API calls
├── store/            # Zustand store for state management
├── navigator.tsx     # Navigation configuration
├── index.ts          # Module exports
└── README.md         # This file
```

## Features

1. **Selfie Upload**: Driver can capture and upload their selfie
2. **Refueller Image Upload**: Driver can capture and upload refueller image
3. **Location Tracking**: Automatically captures current location
4. **Checkout Process**: Completes the checkout flow by calling the appropriate APIs
5. **State Management**: Uses Zustand for local state management

## Usage

The checkout flow can be navigated to using:
```javascript
navigation.navigate('checkout');
```

## Implementation Details

The checkout module follows the same patterns as other modules in the application:
- Uses Zustand for state management
- Follows the service pattern for business logic
- Uses GraphQL for API communication
- Reuses common components where possible
- Follows the same navigation patterns as other modules

## Required Images

1. **Selfie**: Driver's selfie image
2. **Refueller**: Refueller image

Both images are required before the checkout process can be completed.

## API Integration

The module integrates with the following backend services:
- Driver checkout mutation
- Last check-in details query
- Image upload services (reusing support module)
- Vehicle state update services (reusing checkin module)

## State Management

The checkout store manages the following state:
- Selfie image data and URL
- Refueller image data and URL
- Loading states for various operations
- Checkout completion status