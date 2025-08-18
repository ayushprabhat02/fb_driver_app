module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['react-native-reanimated/plugin'], // Keep this first
    [
      'module-resolver', // Plugin name
      {
        // Plugin options
        root: ['./'],
        alias: {
          '@': './',
        },
      },
    ],
  ],
};
