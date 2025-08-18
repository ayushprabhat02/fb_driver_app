package in.driver.app;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.util.Formatter;
import javax.crypto.Mac;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

public class NdpsAesModule extends ReactContextBaseJavaModule {

    private String password = "8E41C78439831010F81F61C344B7BFC7";
    private String salt = "8E41C78439831010F81F61C344B7BFC7";
    private static final String HMAC_SHA512 = "HmacSHA512";
    private static int pswdIterations = 65536;
    private static int keySize = 256;
    private final byte[] ivBytes = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 };

    public NdpsAesModule (@Nullable ReactApplicationContext reactContext){
        super(reactContext);
    }

    @Override
    public String getName() {
        return "NdpsAESLibrary";
    }

    private String encrypt(String plainText) throws Exception {
        byte[] saltBytes = this.salt.getBytes("UTF-8");
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512");
        PBEKeySpec spec = new PBEKeySpec( this.password.toCharArray(),
                saltBytes,
                pswdIterations,
                keySize);
        SecretKey secretKey = factory.generateSecret(spec);
        SecretKeySpec secret = new SecretKeySpec(secretKey.getEncoded(), "AES");
        IvParameterSpec localIvParameterSpec = new IvParameterSpec(this.ivBytes);
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(1, secret, localIvParameterSpec);
        byte[] encryptedTextBytes = cipher.doFinal(plainText.getBytes("UTF-8"));
        return byteToHex(encryptedTextBytes);
    }

    private String byteToHex(byte[] byData) {
        StringBuffer sb = new StringBuffer(byData.length * 2);
        for (int i = 0; i < byData.length; ++i) {
            int v = byData[i] & 0xFF; if (v < 16)
                sb.append('0'); sb.append(Integer.toHexString(v));
        }
        return sb.toString().toUpperCase();
    }

    @ReactMethod
    public void ndpsEncrypt (String plainText, String key, Promise promise) {
        try {
            this.password = key;
            this.salt = key;
            String encryptedStr = encrypt(plainText);
            promise.resolve(encryptedStr);
        } catch (Exception err) {
            promise.reject(err);
        }
    }

    @ReactMethod
    public void ndpsDecrypt (String encryptedText, String key, Promise promise) {
        try {
            this.password = key;
            this.salt = key;
            String decryptedStr = decrypt(encryptedText);
            promise.resolve(decryptedStr);
        } catch (Exception err) {
            promise.reject(err);
        }
    }

    private String decrypt(String encryptedText) throws Exception
    {
        byte[] saltBytes = this.salt.getBytes("UTF-8");
        byte[] encryptedTextBytes = hex2ByteArray(encryptedText);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512");
        PBEKeySpec spec = new PBEKeySpec(
                this.password.toCharArray(),
                saltBytes,
                pswdIterations,
                keySize);
        SecretKey secretKey = factory.generateSecret(spec);
        SecretKeySpec secret = new SecretKeySpec(secretKey.getEncoded(), "AES");
        IvParameterSpec localIvParameterSpec = new IvParameterSpec(this.ivBytes);
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding"); cipher.init(2, secret, localIvParameterSpec);
        byte[] decryptedTextBytes = (byte[])null; decryptedTextBytes = cipher.doFinal(encryptedTextBytes);
        return new String(decryptedTextBytes);
    }

    private byte[] hex2ByteArray(String sHexData) {
        byte[] rawData = new byte[sHexData.length() / 2];
        for (int i = 0; i < rawData.length; ++i)
        {
            int index = i * 2;
            int v = Integer.parseInt(sHexData.substring(index, index + 2).trim(), 16);
            rawData[i] = (byte)v;
        }
        return rawData;
    }

    private static String toHexStringHmac(byte[] bytes) {
        Formatter formatter = new Formatter();
        for (byte b : bytes) {
            formatter.format("%02x", b);
        }
        return formatter.toString();
    }

    @ReactMethod
    public void calculateHMAC(String data, String key, Promise promise)
            throws Exception
    {
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(), HMAC_SHA512);
            Mac mac = Mac.getInstance(HMAC_SHA512);
            mac.init(secretKeySpec);
//            return toHexStringHmac(mac.doFinal(data.getBytes()));
            promise.resolve(toHexStringHmac(mac.doFinal(data.getBytes())));
        } catch (Exception err) {
            promise.reject(err);
        }
    }

}