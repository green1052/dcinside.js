/** 디시인사이드 공식 안드로이드 앱(5.3.6) 식별 정보입니다. */
export const APP = {
    package: "com.dcinside.app.android",
    versionCode: "100175",
    versionName: "5.3.6",
    /** 앱 서명 인증서 SHA-256(Base64). `app_id` 발급에 사용합니다. */
    signature: "5rJxRKJ2YLHgBgj6RdMZBl2X0KcftUuMoXVug0bsKd0=",
    userAgent: "dcinside.app",
    referer: "http://www.dcinside.com/",
    /** 앱 웹뷰 UA입니다. Android WebView 기본 UA 뒤에 ` dcinside.app`을 붙입니다(`WebViews.m`). */
    webViewUserAgent: "Mozilla/5.0 (Linux; Android 16; SM-S928N Build/BP4A.251205.006; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/144.0.7500.8 Mobile Safari/537.36 dcinside.app"
} as const;

/** 앱에 내장된 Firebase/GCM 설정입니다. */
export const FIREBASE = {
    appId: "1:477369754343:android:d2ffdd960120a207727842",
    apiKey: "AIzaSyDcbVof_4Bi2GwJ1H8NjSwSTaMPPZeCE38",
    projectId: "dcinside-b3f40",
    sender: "477369754343",
    /** 서명 인증서 SHA-1입니다. */
    cert: "43BD70DFC365EC1749F0424D28174DA44EE7659D",
    installationsSdk: "a:18.0.0",
    remoteConfigSdk: "22.0.0",
    cliv: "fcm-24.0.2",
    gmsVersion: "254932038",
    firebaseClient: "H4sIAAAAAAAA_6tWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA",
    appNameHash: "R1dAH9Ui7M-ynoznwBdw01tLxhI",
    info: "g4IHbGFOdmkToOhBO1boBVxFgO7Wuhk",
    osVersion: "36",
    targetSdk: "36",
    dalvikUserAgent: "Dalvik/2.1.0 (Linux; U; Android 16; SM-S928N Build/BP4A.251205.006)",
    gmsUserAgent: "com.google.android.gms/254932038 (Linux; U; Android 16; ko_KR; SM-S928N; Build/BP4A.251205.006; Cronet/144.0.7500.8)"
} as const;

export const HOST = {
    app: "https://app.dcinside.com",
    upload: "https://upload.dcinside.com",
    movie: "https://m4up4.dcinside.com",
    mobile: "https://m.dcinside.com",
    pc: "https://gall.dcinside.com",
    json: "https://json.dcinside.com",
    json2: "https://json2.dcinside.com",
    sign: "https://msign.dcinside.com"
} as const;

/** 앱이 `redirect.php?hash=`로 감싸서 보내는 GET 경로입니다. */
export const REDIRECTED_PATHS: ReadonlySet<string> = new Set([
    "/api/gall_list_new.php",
    "/api/gall_view_new.php",
    "/api/comment_new.php",
    "/api/view_img.php"
]);
