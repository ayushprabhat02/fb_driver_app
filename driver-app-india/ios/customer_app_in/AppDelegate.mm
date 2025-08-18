#import "AppDelegate.h"
// #import <Firebase.h>

#import <React/RCTBundleURLProvider.h>
#import <GoogleMaps/GoogleMaps.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"AIzaSyCfIkG3UgZi8Yqs6bJX1inU7YX40ugzNQg"];
  // [FIRApp configure];
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    if (![defaults boolForKey:@"notFirstRun"]) {
    [defaults setBool:YES forKey:@"notFirstRun"];
    [defaults synchronize];
    // [[FIRAuth auth] signOut:NULL];
    }
  self.moduleName = @"customer_app_in";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
