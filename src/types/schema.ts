// scripts/gen-types.ts가 생성합니다. 직접 고치지 마세요.
// 모델 이름 → {키: 스펙}. 스펙 형식은 scripts/gen-types.ts의 tsType 주석을 보세요.
export const SCHEMA: Record<string, Record<string, string>> = {
    "AiCharacterPromptResult": {
        "result": "b",
        "data": "AiCharacterPromptResultData[]"
    },
    "AiCharacterPromptResultData": {
        "name": "s",
        "prompt": "s"
    },
    "AiFillPromptsResult": {
        "result": "b",
        "prompts": "s",
        "msg": "s"
    },
    "AiImageInsertResult": {
        "result": "b",
        "msg": "s",
        "data": "s",
        "ct_img": "s",
        "limit": "b"
    },
    "AiImageStatus": {
        "result": "b",
        "generate_cnt": "i",
        "set_cnt": "i",
        "prompts": "s[]",
        "samples": "AiSampleList",
        "styles": "s[]",
        "lora_list": "{LoraModel}",
        "models": "{s}"
    },
    "AiPromptListResult": {
        "result": "b",
        "msg": "s",
        "prompt_list": "AiPromptLoadItem[]",
        "list_cnt": "n"
    },
    "AiPromptLoadItem": {
        "idx": "n",
        "mno": "n",
        "title": "s",
        "prompt": "s",
        "negative_prompt": "s"
    },
    "AiResampleResult": {
        "result": "b",
        "msg": "s",
        "filename": "s"
    },
    "AiSampleList": {
        "ani": "s[]",
        "real": "s[]"
    },
    "AlarmMessageList": {
        "lists": "AlarmMessageListList[]"
    },
    "AlarmMessageListList": {
        "idx": "s",
        "title": "s",
        "message": "s",
        "gallery_id": "s",
        "content_no": "s",
        "comment_content": "s",
        "writer_nick": "s",
        "alarm_type": "s",
        "gall_ko_name": "s",
        "comment_cnt": "i",
        "regdate": "s",
        "type": "s",
        "user_id": "s",
        "ip": "s",
        "comment_nick": "s",
        "comment_no": "i"
    },
    "AlarmSetting": {
        "use_yn": "i",
        "keyword": "i",
        "keyword_cnt": "i",
        "recomm": "i",
        "recomm_cnt": "i",
        "attention": "i",
        "article_cnt": "i",
        "activity": "i",
        "notify": "i",
        "notify_cnt": "i",
        "user": "i",
        "user_cnt": "i",
        "recomm_article": "i",
        "pum": "i",
        "img_comment": "i"
    },
    "AlarmSubscriptions": {
        "lists": "KeywordAlarmSubscriptionsLists[]",
        "total": "i"
    },
    "ApiResult": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s"
    },
    "AppCheck": {
        "result": "b",
        "cause": "s",
        "ver": "s",
        "notice": "b",
        "notice_update": "b",
        "gall_id": "s",
        "date": "s"
    },
    "AppNotice": {
        "notice": "s",
        "memo2": "s"
    },
    "AppUpdateNotice": {
        "ver": "s",
        "notice": "s"
    },
    "ArticleAlarmConfig": {
        "self_article": "b",
        "article": "b",
        "user": "b"
    },
    "ArticleDeleteResult": {
        "result": "b",
        "cause": "s",
        "del_limit": "i"
    },
    "ArticleImage": {
        "result": "s",
        "cause": "s",
        "img": "s",
        "img_clone": "s"
    },
    "ArticleListResponse": {
        "result": "s",
        "cause": "s",
        "gall_info": "GalleryInfo[]",
        "gall_list": "PostItem[]",
        "is_confirm_id": "b",
        "refresh_join": "b",
        "is_adult_keyword": "b",
        "is_illegal_keyword": "b"
    },
    "ArticleModifyInfo": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "gall_id": "s",
        "gall_no": "i",
        "subject": "s",
        "memo": "{s}[]",
        "file": "{s}[]",
        "file_cnt": "i",
        "file_size": "n",
        "head_text": "PostHead[]",
        "poll": "{s}[]",
        "movie": "{s}[]",
        "aiImg": "{s}[]",
        "fix": "b",
        "secret": "b",
        "auto_del_time": "s",
        "use_ai_write": "b",
        "is_manager_headtext": "b",
        "headid": "i"
    },
    "ArticleTransferResult": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "trans_info": "ArticleTransferResultTransInfo"
    },
    "ArticleTransferResultTransInfo": {
        "gallery_name": "s",
        "memo": "s",
        "thumb": "s",
        "origin": "s",
        "date": "s"
    },
    "ArticleViewResponse": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "view_info": "PostInfo",
        "view_main": "ArticleViewResponseViewMain",
        "is_confirm_id": "b",
        "refresh_join": "b",
        "objection_url": "s"
    },
    "ArticleViewResponseViewMain": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "memo": "s",
        "recommend": "i",
        "recommend_member": "i",
        "nonrecommend": "i",
        "managerskill": "b",
        "nonrecomm_use": "b",
        "pum_cnt": "i",
        "pum_info": "PumInfo",
        "manager_block_img": "b"
    },
    "ArticleVoteResult": {
        "result": "b",
        "member": "s",
        "cause": "s",
        "add": "s",
        "carrier_vpn_ban": "b"
    },
    "AutoImage": {
        "thumb": "s",
        "idx": "i",
        "img": "s",
        "extension": "s"
    },
    "AutoImageGalleryList": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "imgInfo": "AutoImageGalleryListImgInfo[]"
    },
    "AutoImageGalleryListImgInfo": {
        "id": "s",
        "ko_name": "s",
        "random": "s",
        "use": "s",
        "main_image": "i",
        "images": "AutoImage[]"
    },
    "AutoImageList": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "id": "s",
        "ko_name": "s",
        "random": "s",
        "use": "s",
        "main_image": "i",
        "imgInfo": "AutoImage[]"
    },
    "AutoImageSettingResult": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "gallery_id": "s",
        "main_image": "i",
        "random": "s",
        "use": "s"
    },
    "AutoImageUploadResult": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "imgInfo": "AutoImage[]"
    },
    "BigDCConResult": {
        "result": "b",
        "expire": "n",
        "article_limit": "i",
        "comment_limit": "i",
        "day_limit": "i",
        "article_cnt": "i",
        "comment_cnt": "i",
        "result_status": "s",
        "cause": "s"
    },
    "CommentListResponse": {
        "result": "s",
        "cause": "s",
        "total_comment": "i",
        "total_page": "i",
        "re_page": "s",
        "comment_list": "CommentListResponseComment[]",
        "preview_list": "CommentListResponseComment[]"
    },
    "CommentListResponseComment": {
        "name": "s",
        "user_id": "s",
        "member_icon": "i",
        "gallercon": "s",
        "comment_memo": "s",
        "ipData": "s",
        "voice": "s",
        "dccon": "s",
        "dccon_type": "s",
        "dccon_detail_idx": "s",
        "comment_no": "i",
        "date_time": "s",
        "level": "s",
        "under_step": "b",
        "is_delete_flag": "s",
        "del_scope": "i",
        "commentDel_scope": "b",
        "modify_scope": "b",
        "nonuser_num": "s",
        "mention": "Mention",
        "txtcon": "TconInfo"
    },
    "CommentSearchResponse": {
        "result": "b",
        "cause": "s",
        "match_cnt": "n",
        "comment_list": "CommentSearchResponseComment[]"
    },
    "CommentSearchResponseComment": {
        "no": "i"
    },
    "DCConBuyResult": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "code": "s"
    },
    "DCConFolderList": {
        "result": "s",
        "cause": "s",
        "tab": "DCConFolderListTab[]",
        "list": "DCConItem[][]"
    },
    "DCConFolderListTab": {
        "name": "s",
        "hide": "i"
    },
    "DCConFolderResult": {
        "result": "s",
        "cause": "s",
        "message": "s"
    },
    "DCConInsertResult": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "img_src": "s",
        "alt": "s",
        "img_tag": "s"
    },
    "DCConItem": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "detail_idx": "i",
        "package_idx": "i",
        "title": "s",
        "img": "s",
        "fav": "i"
    },
    "DCConListResponse": {
        "result": "s",
        "cause": "s",
        "tab": "DCConListResponseTab[]",
        "list": "DCConItem[][]",
        "hasFav": "b"
    },
    "DCConListResponseTab": {
        "package_idx": "i",
        "title": "s",
        "img": "s"
    },
    "DCConPackageDetail": {
        "result": "b",
        "cause": "s",
        "info": "DCConPackageDetailInfo[]",
        "detail": "DCConPackageDetailDetail[]"
    },
    "DCConPackageDetailDetail": {
        "img": "s"
    },
    "DCConPackageDetailInfo": {
        "package_idx": "s",
        "main_img": "s",
        "title": "s",
        "description": "s",
        "mandu": "s",
        "get_state": "s",
        "seller_name": "s",
        "reg_date": "s"
    },
    "DCConSettingList": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "use_list": "DCConItem[]",
        "unuse_list": "DCConItem[]"
    },
    "Follow": {
        "ko_name": "s",
        "id": "s",
        "minor": "b",
        "mini": "b",
        "gall_state": "s",
        "is_new": "s"
    },
    "GalleryCategory": {
        "category_no": "i",
        "category_name": "s"
    },
    "GalleryInfo": {
        "member_limit": "i",
        "gall_hide": "b",
        "profile_img": "s",
        "member_grant": "i",
        "use_auto_delete": "s",
        "use_secret": "s",
        "anonymous": "s",
        "use_relation_no": "s",
        "use_list_fix": "s",
        "is_mini": "b",
        "auto_refresh_enable": "b",
        "use_ai_write": "b",
        "gall_nickname": "s",
        "capture_nickname": "s",
        "allowWordFlag": "b",
        "must_read": "MustRead",
        "is_person": "b",
        "is_prgall_certified": "b",
        "prgall_profile": "ProfileInfo[]",
        "prgall_img": "s",
        "realname_gall": "b",
        "head_text_up_dt": "n",
        "type": "s",
        "category": "i",
        "gall_title": "s",
        "file_cnt": "i",
        "file_size": "n",
        "is_minor": "b",
        "ser_total_page": "i",
        "ser_pos": "s",
        "no_write": "b",
        "captcha": "b",
        "code_count": "i",
        "is_adult": "b",
        "is_lady": "i",
        "relation_gall": "{s}",
        "notify_recent": "s",
        "head_text": "PostHead[]",
        "placeholder": "PostHeadPlaceHolder[]",
        "managerskill": "b",
        "managerSkill": "b",
        "manager_alarm": "s",
        "manager_situation": "s",
        "minor_danger": "s",
        "gall_state_grant": "s",
        "membership": "b",
        "total_member": "i",
        "member_state": "i",
        "member_join": "b"
    },
    "GalleryIntro": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "id": "s",
        "ko_name": "s",
        "img": "s",
        "mgallery_desc": "s",
        "master_id": "s",
        "master_name": "s",
        "submanager": "ManagerItem[]",
        "create_dt": "s",
        "new": "b",
        "hot_state": "s",
        "total_count": "s",
        "cate_name": "s",
        "mini": "MiniInfo",
        "person": "ManagerRecord"
    },
    "GalleryNameEntry": {
        "category": "i",
        "name": "s",
        "ko_name": "s",
        "linkto": "s",
        "depth": "s"
    },
    "GalleryRankInfo": {
        "result": "b",
        "gallery_list": "GalleryRankInfoGallery[]"
    },
    "GalleryRankInfoGallery": {
        "id": "s",
        "rank": "i",
        "new_post": "i"
    },
    "HitconSettingResult": {
        "result": "s",
        "cause": "s",
        "best_galler": "s"
    },
    "JoinedMiniGalleries": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "myjoinmini_in": "MyGalleryResponseMygall[]",
        "myjoinmini_hold": "MyGalleryResponseMygall[]",
        "myjoinmini_out": "MyGalleryResponseMygall[]"
    },
    "KeywordAlarmSubscriptions": {
        "lists": "{KeywordAlarmSubscriptionsLists}",
        "total": "i"
    },
    "KeywordAlarmSubscriptionsLists": {
        "id": "s",
        "ko_name": "s",
        "keyword": "s[]",
        "idx": "n",
        "content_no": "s",
        "title": "s",
        "nickname": "s",
        "reg_date": "s",
        "article_type": "s",
        "comment_no": "s",
        "type": "s",
        "user": "KeywordAlarmSubscriptionsListsUser[]"
    },
    "KeywordAlarmSubscriptionsListsUser": {
        "user_id": "s",
        "nickname": "s"
    },
    "LiveBestArticle": {
        "id": "s",
        "no": "i",
        "gall_name": "s",
        "title": "s",
        "thumbnail": "s",
        "comment": "i",
        "is_top": "s",
        "reg_time": "s",
        "category": "s",
        "hit": "i",
        "gall_alias": "s",
        "recommend": "i"
    },
    "LoginResult": {
        "auth_change": "i",
        "user_no": "s",
        "user_id": "s",
        "name": "s",
        "stype": "s",
        "is_adult": "i",
        "is_dormancy": "s",
        "is_otp": "s",
        "otp_token": "s",
        "is_bot": "b",
        "result": "b",
        "cause": "s",
        "is_email": "s",
        "pw_campaign": "i",
        "mail_send": "s",
        "is_gonick": "i",
        "best_galler": "s",
        "best_date": "s",
        "is_security_code": "s"
    },
    "LoraModel": {
        "idx": "i",
        "type": "s",
        "prompt_type": "s",
        "default": "s",
        "prompt": "s",
        "add_prompt": "s",
        "image_src": "s",
        "name": "s",
        "promptAccent": "s"
    },
    "MainContent": {
        "hit": "LiveBestArticle[]",
        "new_gallery": "LiveBestArticle[]",
        "livebest": "LiveBestArticle[]",
        "bestfix": "LiveBestArticle[]"
    },
    "MajorGalleryRanking": {
        "category": "s",
        "link": "s",
        "id": "s",
        "rank_type": "s",
        "rank": "i",
        "num": "i",
        "gall_state": "s"
    },
    "ManagedGallery": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "mymanageList": "ManagedGalleryMymanage[]"
    },
    "ManagedGalleryMymanage": {
        "gall_id": "s",
        "gall_koname": "s",
        "gall_type": "s",
        "manager_type": "s",
        "gall_hide": "i",
        "transfer": "s"
    },
    "ManageHistoryResponse": {
        "result": "s",
        "cause": "s",
        "avoid_open": "b",
        "delete_open": "b",
        "setting_open": "b",
        "avoid_list": "ManageHistoryResponseAvoid[]",
        "avoid_count": "i",
        "avoid_days": "i",
        "category": "s"
    },
    "ManageHistoryResponseAvoid": {
        "nickname": "s",
        "user_id": "s",
        "ip": "s",
        "avoid_hour": "s",
        "reg_date": "s",
        "manager_name": "s",
        "manager_id": "s",
        "subject_type": "s",
        "reason": "s",
        "subject": "s",
        "type": "s",
        "ip_user_avoid": "s"
    },
    "ManagerActionResult": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "state": "s"
    },
    "ManagerAppointResult": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "reason": "s",
        "code": "s"
    },
    "ManagerEntrustResult": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "data": "i"
    },
    "ManagerInfo": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "master_id": "s",
        "master_name": "s",
        "situation": "s",
        "dday": "i",
        "resign_reason": "s",
        "create_dt": "s",
        "up_dt": "s",
        "submanager": "ManagerItem[]",
        "entrust_member": "ManagerInfoEntrustMember[]",
        "request": "b"
    },
    "ManagerInfoEntrustMember": {
        "no": "i",
        "subject": "s"
    },
    "ManagerItem": {
        "id": "s",
        "name": "s",
        "situation": "s"
    },
    "ManagerRecord": {
        "history": "ManagerRecordData[]"
    },
    "ManagerRecordData": {
        "content": "s",
        "date": "s",
        "manager": "s"
    },
    "Mention": {
        "name": "s",
        "target_no": "s",
        "number": "s",
        "ip": "s",
        "is_user": "i"
    },
    "MiniGalleryJoinConfirmResult": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "status": "s"
    },
    "MiniGalleryJoinResponse": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "join_question": "s"
    },
    "MiniInfo": {
        "gall_hide": "i",
        "total_member": "i",
        "member_limit": "i",
        "list_scope": "s",
        "view_scope": "s",
        "write_scope": "s"
    },
    "MinorGalleryRanking": {
        "ko_name": "s",
        "link": "s",
        "id": "s",
        "rank_type": "s",
        "rank_updown": "i",
        "rank": "i",
        "gall_state": "s",
        "job": "s",
        "job_detail": "s"
    },
    "MinorNotificationResponse": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "data": "MinorNotificationResponseData"
    },
    "MinorNotificationResponseData": {
        "appoint": "MinorNotificationResponseDataAppoint[]",
        "befired": "MinorNotificationResponseDataBefired[]"
    },
    "MinorNotificationResponseDataAppoint": {
        "id": "s",
        "Is_adult": "s",
        "Is_sex": "s",
        "ko_name": "s",
        "reg_dt": "s",
        "status": "s"
    },
    "MinorNotificationResponseDataBefired": {
        "id": "s",
        "memo": "s",
        "no": "i",
        "reg_dt": "s"
    },
    "MustRead": {
        "subject": "s",
        "no": "i"
    },
    "MyGalleryResponse": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "mygall": "MyGalleryResponseMygall[]",
        "favori": "MyGalleryResponseMygall[]"
    },
    "MyGalleryResponseMygall": {
        "gall_id": "s",
        "gall_koname": "s",
        "gall_hide": "i",
        "is_mini": "b",
        "is_person": "b"
    },
    "NextPost": {
        "no": "i",
        "subject": "s",
        "ip": "s",
        "name": "s",
        "user_id": "s",
        "spoiler": "s"
    },
    "OgLink": {
        "result": "b",
        "title": "s",
        "description": "s",
        "image": "s",
        "domain": "s",
        "targetHref": "s"
    },
    "OtherPost": {
        "no": "i",
        "subject": "s",
        "ip": "s",
        "name": "s",
        "user_id": "s",
        "spoiler": "s"
    },
    "PersonGalleryProfile": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "profile": "ProfileInfo[]"
    },
    "PollFinishResult": {
        "result": "s",
        "msg": "s"
    },
    "PostHead": {
        "no": "i",
        "name": "s",
        "level": "i",
        "selected": "b",
        "recomm_unused": "b",
        "del_limit": "b"
    },
    "PostHeadPlaceHolder": {
        "no": "i",
        "msg": "s"
    },
    "PostInfo": {
        "recommend_code_count": "i",
        "recommend_captcha_type": "s",
        "isNotice": "s",
        "date_time": "s",
        "head_text": "PostHead[]",
        "headid": "i",
        "manager_situation": "s",
        "member_grant": "i",
        "board_del_scope": "i",
        "board_modify_scope": "i",
        "del_time": "s",
        "auto_del_time": "s",
        "anonymous": "s",
        "view_secret": "b",
        "use_auto_delete": "s",
        "use_secret": "s",
        "use_list_fix": "s",
        "is_mini": "b",
        "gall_hide": "b",
        "membership": "b",
        "best_galler_pop": "b",
        "election_gall": "b",
        "is_blocked": "b",
        "gall_nickname": "s",
        "capture_nickname": "s",
        "spoiler": "s",
        "galltitle": "s",
        "is_spoiler_headtext": "b",
        "subject": "s",
        "is_person": "b",
        "category": "i",
        "prev_post": "PrevPost",
        "no": "i",
        "next_post": "NextPost",
        "name": "s",
        "realname_gall": "b",
        "level": "s",
        "is_manager_headtext": "b",
        "is_minor": "b",
        "profile_img": "s",
        "member_icon": "i",
        "prgall_img": "s",
        "gallercon": "s",
        "not_allowed_pum": "b",
        "ip": "s",
        "use_txtcon": "b",
        "best_chk": "s",
        "txtcon_target": "s",
        "best_comid": "s",
        "txtcon_limit": "s",
        "best_comno": "i",
        "total_comment": "i",
        "img_chk": "s",
        "recommend_chk": "s",
        "winnerta_chk": "s",
        "realtime_l_chk": "s",
        "hit": "i",
        "write_type": "s",
        "user_id": "s",
        "no_view": "b",
        "no_comment": "b",
        "comment_captcha": "b",
        "comment_code_count": "i",
        "recommend_captcha": "b"
    },
    "PostItem": {
        "auto_del": "b",
        "poll_icon": "b",
        "fixtop": "b",
        "secret": "b",
        "del_plan": "b",
        "movie_icon": "s",
        "realtime_chk": "s",
        "realtime_l_chk": "s",
        "realtime_color_icon": "b",
        "adult_icon": "b",
        "comment_memo": "s",
        "comment_no": "i",
        "img_no": "s",
        "gall_name": "s",
        "ai_icon": "b",
        "spoiler": "s",
        "is_spoiler_headtext": "b",
        "headnum": "s",
        "result": "s",
        "cause": "s",
        "subject": "s",
        "name": "s",
        "img_icon": "s",
        "recommend": "i",
        "voice_icon": "s",
        "winnerta_icon": "s",
        "recommend_icon": "s",
        "hit_chk": "s",
        "best_chk": "s",
        "pum_chk": "s",
        "hit": "i",
        "user_id": "s",
        "member_icon": "i",
        "gallercon": "s",
        "total_comment": "i",
        "total_voice": "i",
        "no": "i",
        "date_time": "s",
        "ip": "s",
        "level": "s",
        "notify_link": "s",
        "headtext": "s",
        "memo": "s",
        "thumbnail": "s"
    },
    "PrevPost": {
        "no": "i",
        "subject": "s",
        "ip": "s",
        "name": "s",
        "user_id": "s",
        "spoiler": "s"
    },
    "ProfileInfo": {
        "name": "s",
        "value": "s"
    },
    "PumGalleryInfo": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "gall_info": "GalleryInfo"
    },
    "PumHistory": {
        "result": "s",
        "cause": "s",
        "carrier_vpn_ban": "b",
        "msg": "s",
        "history": "PumHistoryHistory[]"
    },
    "PumHistoryHistory": {
        "gall_id": "s",
        "gall_no": "i",
        "gall_name": "s",
        "subject": "s",
        "user_id": "s",
        "nickname": "s",
        "regdate": "s",
        "gall_type": "s",
        "member_icon": "s",
        "gallercon": "s"
    },
    "PumInfo": {
        "gall_id": "s",
        "gall_no": "s",
        "gall_name": "s",
        "gall_type": "s",
        "subject": "s",
        "user_id": "s",
        "nickname": "s",
        "hit_cnt": "i",
        "recommend_cnt": "i",
        "comment_cnt": "i",
        "regdate": "s",
        "gallercon": "s",
        "ip": "s",
        "delete_type": "s",
        "member_icon": "s",
        "memo": "s",
        "thumb": "s",
        "is_secret": "b",
        "data-rel1": "s",
        "data-rel2": "s",
        "data-banned": "i"
    },
    "RecommendArticle": {
        "thumb_img": "s",
        "subject": "s",
        "no": "s",
        "ko_name": "s"
    },
    "RelatedGalleryArticles": {
        "result": "s",
        "cause": "s",
        "total": "RelatedGalleryArticlesTotal[]",
        "gallery": "RelatedGalleryArticlesGallery[]",
        "dccon": "RelatedGalleryArticlesDccon[]"
    },
    "RelatedGalleryArticlesDccon": {
        "package_idx": "i",
        "title": "s",
        "img": "s",
        "nick_name": "s",
        "description": "s"
    },
    "RelatedGalleryArticlesGallery": {
        "fwingList": "Follow[]",
        "followingList": "Follow[]"
    },
    "RelatedGalleryArticlesTotal": {
        "board_cnt": "s"
    },
    "ScrapFolder": {
        "no": "i",
        "name": "s"
    },
    "ScrapFolderList": {
        "result": "b",
        "cause": "s",
        "folder_list": "ScrapFolder[]"
    },
    "ScrapFolderResult": {
        "result": "b",
        "cause": "s"
    },
    "ScrapShareMultiResult": {
        "result": "b",
        "cause": "s",
        "scrap": "i[]",
        "folder": "ScrapFolder[]"
    },
    "ScrapShareResult": {
        "result": "s",
        "cause": "s",
        "isScrap": "b",
        "recent_folder": "i",
        "recent_name": "s",
        "folder": "ScrapFolder[]"
    },
    "SearchResponse": {
        "result": "s",
        "cause": "s",
        "info": "SearchResponseInfo[]",
        "gall_list": "SearchResponseGall[]",
        "recomm_list": "SearchResponseGall[]",
        "list": "SearchResponseGall[]",
        "board": "SearchResponseGall[]",
        "wiki": "SearchResponseGall[]",
        "movie": "SearchResponseGall[]",
        "is_adult_keyword": "b",
        "is_illegal_keyword": "b",
        "gall_cnt": "i",
        "allowFlag": "b"
    },
    "SearchResponseGall": {
        "title": "s",
        "content": "s",
        "id": "s",
        "no": "i",
        "regdate": "s",
        "url": "s",
        "gall_name": "s",
        "gall_state": "s",
        "thumbnail": "s",
        "is_adult": "i",
        "play_cnt": "i",
        "play_time": "i",
        "rank": "i",
        "gall_type": "s",
        "member_cnt": "i",
        "new_post": "i",
        "total_post": "i",
        "profile_img": "s",
        "verify": "s",
        "info": "s"
    },
    "SearchResponseInfo": {
        "total_page": "i",
        "type": "s"
    },
    "TconInfo": {
        "bg_color": "s",
        "font_color": "s"
    },
    "UserGallogCount": {
        "result": "b",
        "cause": "s",
        "article_cnt": "i",
        "reply_cnt": "i"
    },
    "VideoInfoResult": {
        "result": "s",
        "cause": "s",
        "mv_token": "s",
        "mv_no": "s"
    },
    "VideoUploadResult": {
        "msg": "s",
        "file_no": "s",
        "thum_url_arr": "s[]",
        "width": "i",
        "height": "i"
    },
    "VoiceDownloadResult": {
        "result": "b",
        "cause": "s",
        "download": "s",
        "gall": "s",
        "name": "s",
        "title": "s"
    }
};
