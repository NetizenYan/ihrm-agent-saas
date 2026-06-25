package com.ihrm.common.utils;

import com.google.gson.Gson;
import com.qiniu.common.Zone;
import com.qiniu.http.Response;
import com.qiniu.storage.Configuration;
import com.qiniu.storage.UploadManager;
import com.qiniu.storage.model.DefaultPutRet;
import com.qiniu.util.Auth;

import java.util.Date;

public class QiniuUploadUtil {

    private static final String accessKey = readConfig("IHRM_QINIU_ACCESS_KEY", "");
    private static final String secretKey = readConfig("IHRM_QINIU_SECRET_KEY", "");
    private static final String bucket = readConfig("IHRM_QINIU_BUCKET", "ihrm-test");
    private static final String prix = readConfig("IHRM_QINIU_DOMAIN", "http://example.com/");
    private UploadManager manager;

    private static String readConfig(String name, String defaultValue) {
        String value = System.getenv(name);
        if (value == null || value.trim().isEmpty()) {
            value = System.getProperty(name);
        }
        return value == null || value.trim().isEmpty() ? defaultValue : value.trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    public QiniuUploadUtil() {
        //初始化基本配置
        Configuration cfg = new Configuration(Zone.zone0());
        //创建上传管理器
        manager = new UploadManager(cfg);
    }

	//文件名 = key
	//文件的byte数组
    public String upload(String imgName , byte [] bytes) {
        if (isBlank(accessKey) || isBlank(secretKey) || isBlank(bucket)) {
            throw new IllegalStateException("Qiniu upload credentials are not configured");
        }
        Auth auth = Auth.create(accessKey, secretKey);
        //构造覆盖上传token
        String upToken = auth.uploadToken(bucket,imgName);
        try {
            Response response = manager.put(bytes, imgName, upToken);
            DefaultPutRet putRet = new Gson().fromJson(response.bodyString(), DefaultPutRet.class);
            //返回请求地址
            return prix+putRet.key+"?t="+new Date().getTime();
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return null;
    }
}
