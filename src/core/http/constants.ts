export const API_URL = {
    pcWeb: "https://gall.dcinside.com/",
    mobileWeb: "http://m.dcinside.com/",
    mobileWebHttps: "https://m.dcinside.com/",
    mobileApp: "https://app.dcinside.com/",
    appApi: "https://app.dcinside.com/api/",
    authApi: "https://msign.dcinside.com/",
    mainApi: "http://json2.dcinside.com/",
    uploadBase: "https://upload.dcinside.com/",
    movieUpload: "https://m4up4.dcinside.com/",
    redirect: "https://app.dcinside.com/api/redirect.php",

    article: {
        list: "https://app.dcinside.com/api/gall_list_new.php",
        read: "https://app.dcinside.com/api/gall_view_new.php",
        write: "https://upload.dcinside.com/_app_write_api.php",
        delete: "https://app.dcinside.com/api/gall_del.php",
        modify: "https://app.dcinside.com/api/gall_modify.php",
        upvote: "https://app.dcinside.com/api/_recommend_up.php",
        downvote: "https://app.dcinside.com/api/_recommend_down.php",
        report: "http://m.dcinside.com/api/report.php",
        hitUpvote: "https://app.dcinside.com/api/hit_recommend"
    },

    comment: {
        ok: "https://app.dcinside.com/api/comment_ok.php",
        delete: "https://app.dcinside.com/api/comment_del.php",
        read: "https://app.dcinside.com/api/comment_new.php"
    },

    auth: {
        login: "https://msign.dcinside.com/api/login",
        appId: "https://msign.dcinside.com/auth/mobile_app_verification",
        appCheck: "https://json2.dcinside.com/json0/app_check_A_rina_one_new.php"
    },

    firebase: {
        installations: "https://firebaseinstallations.googleapis.com/v1/projects/dcinside-b3f40/installations",
        remoteConfig: "https://firebaseremoteconfig.googleapis.com/v1/projects/477369754343/namespaces/firebase:fetch"
    },

    playService: {
        checkin: "https://android.clients.google.com/checkin",
        register3: "https://android.apis.google.com/c2dm/register3"
    },

    dccon: {
        dccon: "https://app.dcinside.com/api/dccon.php"
    },

    gallery: {
        minorInfo: "https://app.dcinside.com/api/minor_info",
        minorManagement: "https://gall.dcinside.com/mgallery/management/mobile",
        minorNoMember: "https://m.dcinside.com/management/minor/nomember",
        minorManagerRequest: "https://app.dcinside.com/api/_manager_request.php",
        minorBlockWeb: "https://app.dcinside.com/api/minor_avoid",
        minorBlockAdd: "https://app.dcinside.com/api/minor_avoidadd"
    },

    upload: {
        checkUploadRestriction: "https://app.dcinside.com/api/chk_upload_restriction",
        movie: "https://m4up4.dcinside.com/movie_upload_v1.php"
    },

    search: {
        search: "https://app.dcinside.com/api/_total_search.php"
    },

    user: {
        myGall: "https://app.dcinside.com/api/mygall.php",
        myGallModify: "https://app.dcinside.com/api/mygall_modify.php",
        myManageGallCheck: "https://app.dcinside.com/api/mymanageGallChk",
        myMiniJoinCheck: "https://app.dcinside.com/api/myminijoinGallChk"
    },

    miniGallery: {
        join: "https://app.dcinside.com/api/memberjoin",
        joinOk: "https://app.dcinside.com/api/memberjoin_ok",
        quit: "https://app.dcinside.com/api/memberout_ok"
    },

    mainInfo: {
        appMain: "http://json2.dcinside.com/json3/main_content.php",
        galleryRanking: "http://json2.dcinside.com/json3/ranking_gallery.php",
        minorGalleryRanking: "http://json2.dcinside.com/json1/mgallmain/mgallery_ranking.php",
        miniGalleryRanking: "http://json2.dcinside.com/json1/migallmain/migallery_ranking.php",
        personGalleryRanking: "http://json2.dcinside.com/json1/prgallmain/prgallery_ranking.php"
    }
} as const;

export const DC_APP = {
    signature: "5rJxRKJ2YLHgBgj6RdMZBl2X0KcftUuMoXVug0bsKd0=",
    package: "com.dcinside.app.android",
    versionCode: "100166",
    versionName: "5.2.17",
    targetVersion: "36",
    userAgent: "dcinside.app",
    referer: "http://www.dcinside.com"
};

export const FIREBASE = {
    appId: "1:477369754343:android:d2ffdd960120a207727842",
    authVersion: "FIS_v2",
    firebaseClient: "H4sIAAAAAAAA_6tWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA",
    sdkVersion: "a:18.0.0",
    remoteConfigSdkVersion: "22.0.0",
    cert: "43BD70DFC365EC1749F0424D28174DA44EE7659D",
    osVersion: "36",
    targetVer: "35",
    cliv: "fcm-24.0.2",
    info: "g4IHbGFOdmkToOhBO1boBVxFgO7Wuhk",
    gcmVersion: "254932038",
    apiKey: "AIzaSyDcbVof_4Bi2GwJ1H8NjSwSTaMPPZeCE38",
    sender: "477369754343",
    firebaseAppNameHash: "R1dAH9Ui7M-ynoznwBdw01tLxhI",
    registerUserAgent: "Dalvik/2.1.0 (Linux; U; Android 16; SM-S928N Build/BP4A.251205.006)"
};