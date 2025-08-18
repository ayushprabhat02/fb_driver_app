package in.driver.app;

import android.app.Application;
import android.content.Context;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.defaults.DefaultReactNativeHost;

import com.facebook.soloader.SoLoader;
import java.util.ArrayList;
import java.util.List;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;
import org.jetbrains.annotations.NotNull;
import in.driver.app.NdpsAesPackage;


@Metadata(
        mv = {1, 8, 0},
        k = 1,
        d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0002\n\u0000\u0018\u00002\u00020\u00012\u00020\u0002B\u0005¢\u0006\u0002\u0010\u0003J\b\u0010\f\u001a\u00020\rH\u0016R\u0014\u0010\u0004\u001a\u00020\u00058VX\u0096\u0004¢\u0006\u0006\u001a\u0004\b\u0006\u0010\u0007R\u0014\u0010\b\u001a\u00020\tX\u0096\u0004¢\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u000b¨\u0006\u000e"},
        d2 = {"Lin/driver/app/MainApplication;", "Landroid/app/Application;", "Lcom/facebook/react/ReactApplication;", "()V", "reactHost", "Lcom/facebook/react/ReactHost;", "getReactHost", "()Lcom/facebook/react/ReactHost;", "reactNativeHost", "Lcom/facebook/react/ReactNativeHost;", "getReactNativeHost", "()Lcom/facebook/react/ReactNativeHost;", "onCreate", "", "app_debug"}
)
public final class MainApplication extends Application implements ReactApplication {

    @NotNull
    private final ReactNativeHost reactNativeHost = (ReactNativeHost) (new DefaultReactNativeHost((Application) this) {
        private final boolean isNewArchEnabled = false;
        private final boolean isHermesEnabled = true;

        @NotNull
        protected List getPackages() {
            ArrayList var1 = (new PackageList((ReactNativeHost) this)).getPackages();
            var1.add(new NdpsAesPackage()); // Adding your custom package
            boolean var3 = false;
            Intrinsics.checkNotNullExpressionValue(var1, "PackageList(this).packag…ePackage())\n            }");
            return (List) var1;
        }

        @NotNull
        protected String getJSMainModuleName() {
            return "index";
        }

        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        protected boolean isNewArchEnabled() {
            return this.isNewArchEnabled;
        }

        @NotNull
        protected Boolean isHermesEnabled() {
            return this.isHermesEnabled;
        }
    });

    @NotNull
    public ReactNativeHost getReactNativeHost() {
        return this.reactNativeHost;
    }

    @NotNull
    public ReactHost getReactHost() {
        Context var10000 = this.getApplicationContext();
        Intrinsics.checkNotNullExpressionValue(var10000, "this.applicationContext");
        return DefaultReactHost.getDefaultReactHost(var10000, this.getReactNativeHost());
    }



    public void onCreate() {
        super.onCreate();
        SoLoader.init((Context) this, false);

    }
}