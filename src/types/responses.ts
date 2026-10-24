// 이 파일은 디시인사이드 공식 앱 5.3.20(100191)의 Gson 응답 모델에서 생성했습니다.
// 서버가 내려주는 키 이름을 그대로 쓰며, 모든 필드는 서버 사정에 따라 빠질 수 있어 optional입니다.

// ── 공통 ────────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.model.g0` */
export interface ApiResult {
    result?: string;
    cause?: string;
    carrier_vpn_ban?: boolean;
    msg?: string;
}

// ── 인증 ────────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.realm.J` */
export interface LoginResult {
    user_no?: string;
    user_id?: string;
    name?: string;
    stype?: string;
    is_adult?: number;
    is_dormancy?: string;
    is_otp?: string;
    otp_token?: string;
    is_bot?: boolean;
    result?: boolean;
    cause?: string;
    is_email?: string;
    pw_campaign?: number;
    mail_send?: string;
    is_gonick?: number;
    best_galler?: string;
    best_date?: string;
    is_security_code?: string;
    auth_change?: number;
}

// ── 게시글 ───────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.response.MustRead` */
export interface MustRead {
    subject?: string;
    no?: number;
}

/** 앱 모델 `com.dcinside.app.model.ProfileInfo` */
export interface ProfileInfo {
    name?: string;
    value?: string;
}

/** 앱 모델 `com.dcinside.app.response.PostHead` */
export interface PostHead {
    del_limit?: boolean;
    no?: number;
    name?: string;
    level?: number;
    selected?: boolean;
    recomm_unused?: boolean;
}

/** 앱 모델 `com.dcinside.app.response.PostHeadPlaceHolder` */
export interface PostHeadPlaceHolder {
    no?: number;
    msg?: string;
}

/** 앱 모델 `com.dcinside.app.response.GalleryInfo` */
export interface GalleryInfo {
    use_relation_no?: string;
    use_list_fix?: string;
    is_mini?: boolean;
    auto_refresh_enable?: boolean;
    use_ai_write?: boolean;
    gall_nickname?: string;
    capture_nickname?: string;
    allowWordFlag?: boolean;
    must_read?: MustRead;
    is_person?: boolean;
    is_prgall_certified?: boolean;
    prgall_profile?: ProfileInfo[];
    prgall_img?: string;
    realname_gall?: boolean;
    head_text_up_dt?: number;
    type?: string;
    is_minor?: boolean;
    ser_total_page?: number;
    ser_pos?: string;
    category?: number;
    no_write?: boolean;
    gall_title?: string;
    captcha?: boolean;
    file_cnt?: number;
    code_count?: number;
    is_adult?: boolean;
    is_lady?: number;
    relation_gall?: Record<string, string>;
    notify_recent?: string;
    head_text?: PostHead[];
    placeholder?: PostHeadPlaceHolder[];
    managerskill?: boolean;
    managerSkill?: boolean;
    manager_alarm?: string;
    manager_situation?: string;
    minor_danger?: string;
    gall_state_grant?: string;
    membership?: boolean;
    total_member?: number;
    member_state?: number;
    member_join?: boolean;
    member_limit?: number;
    gall_hide?: boolean;
    profile_img?: string;
    member_grant?: number;
    file_size?: number;
    use_auto_delete?: string;
    is_grant_major?: boolean;
    use_secret?: string;
    anonymous?: string;
}

/** 앱 모델 `com.dcinside.app.response.PostItem` */
export interface PostItem {
    realtime_color_icon?: boolean;
    adult_icon?: boolean;
    comment_memo?: string;
    comment_no?: number;
    img_no?: string;
    gall_name?: string;
    ai_icon?: boolean;
    spoiler?: string;
    is_spoiler_headtext?: boolean;
    headnum?: string;
    recommend?: number;
    voice_icon?: string;
    winnerta_icon?: string;
    result?: string;
    recommend_icon?: string;
    cause?: string;
    hit_chk?: string;
    subject?: string;
    best_chk?: string;
    pum_chk?: string;
    hit?: number;
    user_id?: string;
    member_icon?: number;
    gallercon?: string;
    total_comment?: number;
    total_voice?: number;
    no?: number;
    date_time?: string;
    ip?: string;
    level?: string;
    notify_link?: string;
    headtext?: string;
    memo?: string;
    thumbnail?: string;
    auto_del?: boolean;
    poll_icon?: boolean;
    fixtop?: boolean;
    secret?: boolean;
    del_plan?: boolean;
    name?: string;
    movie_icon?: string;
    img_icon?: string;
    realtime_chk?: string;
    realtime_l_chk?: string;
}

/** 앱 모델 `com.dcinside.app.response.j` */
export interface ArticleListResponse {
    result?: string;
    cause?: string;
    gall_info?: GalleryInfo[];
    gall_list?: PostItem[];
    is_confirm_id?: boolean;
    refresh_join?: boolean;
    is_adult_keyword?: boolean;
    is_illegal_keyword?: boolean;
}

/** 앱 모델 `com.dcinside.app.model.PumInfo` */
export interface PumInfo {
    user_id?: string;
    nickname?: string;
    hit_cnt?: number;
    gall_id?: string;
    recommend_cnt?: number;
    gall_no?: string;
    comment_cnt?: number;
    gall_name?: string;
    regdate?: string;
    gallercon?: string;
    ip?: string;
    delete_type?: string;
    member_icon?: string;
    memo?: string;
    thumb?: string;
    is_secret?: boolean;
    "data-rel1"?: string;
    "data-rel2"?: string;
    "data-banned"?: number;
    gall_type?: string;
    subject?: string;
}

/** 앱 모델 `com.dcinside.app.model.U.a` */
export interface ArticleViewResponseViewMain extends ApiResult {
    recommend?: number;
    recommend_member?: number;
    nonrecommend?: number;
    managerskill?: boolean;
    nonrecomm_use?: boolean;
    pum_cnt?: number;
    pum_info?: PumInfo;
    manager_block_img?: boolean;
    memo?: string;
}

/** 앱 모델 `com.dcinside.app.model.OtherPost` */
export interface OtherPost {
    spoiler?: string;
    no?: number;
    subject?: string;
    ip?: string;
    name?: string;
    user_id?: string;
}

/** 앱 모델 `com.dcinside.app.model.PrevPost` */
export interface PrevPost extends OtherPost {
}

/** 앱 모델 `com.dcinside.app.model.NextPost` */
export interface NextPost extends OtherPost {
}

/** 앱 모델 `com.dcinside.app.model.PostInfo` */
export interface PostInfo {
    board_del_scope?: number;
    board_modify_scope?: number;
    del_time?: string;
    auto_del_time?: string;
    anonymous?: string;
    view_secret?: boolean;
    use_auto_delete?: string;
    use_secret?: string;
    use_list_fix?: string;
    is_mini?: boolean;
    gall_hide?: boolean;
    membership?: boolean;
    best_galler_pop?: boolean;
    election_gall?: boolean;
    is_blocked?: boolean;
    gall_nickname?: string;
    capture_nickname?: string;
    spoiler?: string;
    is_spoiler_headtext?: boolean;
    is_person?: boolean;
    prev_post?: PrevPost;
    next_post?: NextPost;
    realname_gall?: boolean;
    level?: string;
    is_manager_headtext?: boolean;
    is_minor?: boolean;
    profile_img?: string;
    member_icon?: number;
    prgall_img?: string;
    galltitle?: string;
    gallercon?: string;
    not_allowed_pum?: boolean;
    subject?: string;
    ip?: string;
    use_txtcon?: boolean;
    category?: number;
    best_chk?: string;
    txtcon_target?: string;
    best_comid?: string;
    txtcon_limit?: string;
    best_comno?: number;
    total_comment?: number;
    img_chk?: string;
    recommend_chk?: string;
    winnerta_chk?: string;
    realtime_l_chk?: string;
    hit?: number;
    write_type?: string;
    user_id?: string;
    no_view?: boolean;
    no_comment?: boolean;
    comment_captcha?: boolean;
    comment_code_count?: number;
    recommend_captcha?: boolean;
    recommend_code_count?: number;
    recommend_captcha_type?: string;
    isNotice?: string;
    date_time?: string;
    head_text?: PostHead[];
    no?: number;
    headid?: number;
    name?: string;
    manager_situation?: string;
    member_grant?: number;
}

/** 앱 모델 `com.dcinside.app.model.U` */
export interface ArticleViewResponse extends ApiResult {
    view_main?: ArticleViewResponseViewMain;
    is_confirm_id?: boolean;
    refresh_join?: boolean;
    objection_url?: string;
    view_info?: PostInfo;
}

/** 앱 모델 `com.dcinside.app.model.PostImage` */
export interface ArticleImage {
    result?: string;
    cause?: string;
    img?: string;
    img_clone?: string;
}

/** 앱 모델 `com.dcinside.app.model.PostModify` */
export interface ArticleModifyInfo extends ApiResult {
    gall_no?: number;
    subject?: string;
    memo?: Record<string, string>[];
    file?: Record<string, string>[];
    file_cnt?: number;
    file_size?: number;
    head_text?: PostHead[];
    poll?: Record<string, string>[];
    movie?: Record<string, string>[];
    aiImg?: Record<string, string>[];
    fix?: boolean;
    secret?: boolean;
    auto_del_time?: string;
    use_ai_write?: boolean;
    is_manager_headtext?: boolean;
    headid?: number;
    gall_id?: string;
}

/** 앱 모델 `com.dcinside.app.response.i` */
export interface ArticleDeleteResult {
    result?: boolean;
    cause?: string;
    del_limit?: number;
}

/** 앱 모델 `com.dcinside.app.model.F` */
export interface ArticleVoteResult {
    result?: boolean;
    member?: string;
    cause?: string;
    add?: string;
    carrier_vpn_ban?: boolean;
}

/** 앱 모델 `com.dcinside.app.model.RelationData.c` */
export interface RelatedGalleryArticlesTotal {
    board_cnt?: string;
}

/** 앱 모델 `com.dcinside.app.model.RelationData.Follow` */
export interface Follow {
    is_new?: string;
    ko_name?: string;
    id?: string;
    minor?: boolean;
    mini?: boolean;
    gall_state?: string;
}

/** 앱 모델 `com.dcinside.app.model.RelationData.a` */
export interface RelatedGalleryArticlesGallery {
    fwingList?: Follow[];
    followingList?: Follow[];
}

/** 앱 모델 `com.dcinside.app.model.RelationData.b` */
export interface RelatedGalleryArticlesDccon {
    package_idx?: number;
    title?: string;
    img?: string;
    nick_name?: string;
    description?: string;
}

/** 앱 모델 `com.dcinside.app.model.RelationData` */
export interface RelatedGalleryArticles {
    result?: string;
    cause?: string;
    total?: RelatedGalleryArticlesTotal[];
    gallery?: RelatedGalleryArticlesGallery[];
    dccon?: RelatedGalleryArticlesDccon[];
}

/** 앱 모델 `com.dcinside.app.model.S` */
export interface OgLink {
    result?: boolean;
    title?: string;
    description?: string;
    image?: string;
    domain?: string;
    targetHref?: string;
}

/** 앱 모델 `com.dcinside.app.model.i0` */
export interface ArticleTransferResultTransInfo {
    gallery_name?: string;
    memo?: string;
    thumb?: string;
    origin?: string;
    date?: string;
}

/** 앱 모델 `com.dcinside.app.model.j0` */
export interface ArticleTransferResult extends ApiResult {
    trans_info?: ArticleTransferResultTransInfo;
}

/** 앱 모델 `com.dcinside.app.model.e0` */
export interface PollFinishResult {
    result?: string;
    msg?: string;
}

// ── 댓글 ────────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.model.Mention` */
export interface Mention {
    name?: string;
    target_no?: string;
    number?: string;
    ip?: string;
    is_user?: number;
}

/** 앱 모델 `com.dcinside.app.model.TconInfo` */
export interface TconInfo {
    bg_color?: string;
    font_color?: string;
}

/** 앱 모델 `com.dcinside.app.response.m` */
export interface CommentListResponseComment {
    ipData?: string;
    voice?: string;
    dccon?: string;
    name?: string;
    dccon_type?: string;
    user_id?: string;
    dccon_detail_idx?: string;
    member_icon?: number;
    comment_no?: number;
    date_time?: string;
    level?: string;
    under_step?: boolean;
    is_delete_flag?: string;
    del_scope?: number;
    commentDel_scope?: boolean;
    modify_scope?: boolean;
    nonuser_num?: string;
    mention?: Mention;
    txtcon?: TconInfo;
    gallercon?: string;
    comment_memo?: string;
}

/** 앱 모델 `com.dcinside.app.response.n` */
export interface CommentListResponse {
    result?: string;
    cause?: string;
    total_comment?: number;
    total_page?: number;
    re_page?: string;
    comment_list?: CommentListResponseComment[];
    preview_list?: CommentListResponseComment[];
}

/** 앱 모델 `com.dcinside.app.model.V` */
export interface CommentSearchResponseComment {
    no?: number;
}

/** 앱 모델 `com.dcinside.app.model.W` */
export interface CommentSearchResponse {
    result?: boolean;
    cause?: string;
    match_cnt?: number;
    comment_list?: CommentSearchResponseComment[];
}

// ── 갤러리 ───────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.model.ManagerItem` */
export interface ManagerItem {
    id?: string;
    name?: string;
    situation?: string;
}

/** 앱 모델 `com.dcinside.app.model.MiniInfo` */
export interface MiniInfo {
    write_scope?: string;
    gall_hide?: number;
    total_member?: number;
    member_limit?: number;
    list_scope?: string;
    view_scope?: string;
}

/** 앱 모델 `com.dcinside.app.model.ManagerRecordData` */
export interface ManagerRecordData {
    content?: string;
    date?: string;
    manager?: string;
}

/** 앱 모델 `com.dcinside.app.model.ManagerRecord` */
export interface ManagerRecord {
    history?: ManagerRecordData[];
}

/** 앱 모델 `com.dcinside.app.model.MinorInfo` */
export interface GalleryIntro extends ApiResult {
    ko_name?: string;
    img?: string;
    mgallery_desc?: string;
    master_id?: string;
    master_name?: string;
    submanager?: ManagerItem[];
    create_dt?: string;
    new?: boolean;
    hot_state?: string;
    total_count?: string;
    cate_name?: string;
    mini?: MiniInfo;
    person?: ManagerRecord;
    id?: string;
}

/** 앱 모델 `com.dcinside.app.model.D` */
export interface PersonGalleryProfile extends ApiResult {
    profile?: ProfileInfo[];
}

/** 앱 모델 `com.dcinside.app.model.m0` */
export interface UserGallogCount {
    result?: boolean;
    cause?: string;
    article_cnt?: number;
    reply_cnt?: number;
}

/** 앱 모델 `com.dcinside.app.recent.C3386d` */
export interface GalleryRankInfoGallery {
    id?: string;
    rank?: number;
    new_post?: number;
}

/** 앱 모델 `com.dcinside.app.recent.C3394l` */
export interface GalleryRankInfo {
    result?: boolean;
    gallery_list?: GalleryRankInfoGallery[];
}

/** 앱 모델 `com.dcinside.app.model.MajorRanking` */
export interface MajorGalleryRanking {
    num?: number;
    gall_state?: string;
    category?: string;
    link?: string;
    id?: string;
    rank_type?: string;
    rank?: number;
}

/** 앱 모델 `com.dcinside.app.model.MinorRanking` */
export interface MinorGalleryRanking {
    rank?: number;
    gall_state?: string;
    job?: string;
    ko_name?: string;
    job_detail?: string;
    link?: string;
    id?: string;
    rank_type?: string;
    rank_updown?: number;
}

/** 앱 모델 `com.dcinside.app.model.E` */
export interface RecommendArticle {
    thumb_img?: string;
    subject?: string;
    no?: string;
    ko_name?: string;
}

/** 앱 모델 `com.dcinside.app.model.G` */
export interface LiveBestArticle {
    id?: string;
    no?: number;
    gall_name?: string;
    title?: string;
    thumbnail?: string;
    comment?: number;
    is_top?: string;
    reg_time?: string;
    category?: string;
    hit?: number;
    gall_alias?: string;
    recommend?: number;
}

/** 앱 모델 `com.dcinside.app.model.H` */
export interface MainContent {
    hit?: LiveBestArticle[];
    new_gallery?: LiveBestArticle[];
    livebest?: LiveBestArticle[];
    bestfix?: LiveBestArticle[];
}

/** 앱 모델 `com.dcinside.app.gallery.b` */
export interface GalleryCategory {
    category_no?: number;
    category_name?: string;
}

/** 앱 모델 `com.dcinside.app.gallery.c` */
export interface GalleryNameEntry {
    category?: number;
    name?: string;
    ko_name?: string;
    linkto?: string;
    depth?: string;
}

/** 앱 모델 `com.dcinside.app.response.k` */
export interface PumGalleryInfo extends ApiResult {
    gall_info?: GalleryInfo;
}

/** 앱 모델 `com.dcinside.app.response.l.a` */
export interface PumHistoryHistory {
    gall_id?: string;
    gall_no?: number;
    gall_name?: string;
    subject?: string;
    user_id?: string;
    nickname?: string;
    regdate?: string;
    gall_type?: string;
    member_icon?: string;
    gallercon?: string;
}

/** 앱 모델 `com.dcinside.app.response.l` */
export interface PumHistory extends ApiResult {
    history?: PumHistoryHistory[];
}

// ── 관리 ────────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.gallery.history.b` */
export interface ManageHistoryResponseAvoid {
    nickname?: string;
    user_id?: string;
    ip?: string;
    avoid_hour?: string;
    reg_date?: string;
    manager_name?: string;
    manager_id?: string;
    subject_type?: string;
    reason?: string;
    subject?: string;
    type?: string;
    ip_user_avoid?: string;
}

/** 앱 모델 `com.dcinside.app.gallery.history.c` */
export interface ManageHistoryResponse {
    result?: string;
    cause?: string;
    avoid_open?: boolean;
    delete_open?: boolean;
    setting_open?: boolean;
    avoid_list?: ManageHistoryResponseAvoid[];
    avoid_count?: number;
    avoid_days?: number;
    category?: string;
}

/** 앱 모델 `com.dcinside.app.response.g.a` */
export interface ManagerInfoEntrustMember {
    no?: number;
    subject?: string;
}

/** 앱 모델 `com.dcinside.app.response.g` */
export interface ManagerInfo extends ApiResult {
    master_name?: string;
    situation?: string;
    dday?: number;
    resign_reason?: string;
    create_dt?: string;
    up_dt?: string;
    submanager?: ManagerItem[];
    entrust_member?: ManagerInfoEntrustMember[];
    request?: boolean;
    master_id?: string;
}

/** 앱 모델 `com.dcinside.app.response.f` */
export interface ManagerEntrustResult extends ApiResult {
    data?: number;
}

/** 앱 모델 `com.dcinside.app.model.J` */
export interface ManagerAppointResult extends ApiResult {
    code?: string;
    reason?: string;
}

/** 앱 모델 `com.dcinside.app.model.P` */
export interface ManagerActionResult extends ApiResult {
    state?: string;
}

// ── 검색 ────────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.totalsearch.a.c` */
export interface SearchResponseInfo {
    total_page?: number;
    type?: string;
}

/** 앱 모델 `com.dcinside.app.totalsearch.a.f` */
export interface SearchResponseGall {
    title?: string;
    content?: string;
    id?: string;
    no?: number;
    regdate?: string;
    url?: string;
    gall_name?: string;
    gall_state?: string;
    thumbnail?: string;
    is_adult?: number;
    play_cnt?: number;
    play_time?: number;
    rank?: number;
    gall_type?: string;
    member_cnt?: number;
    new_post?: number;
    total_post?: number;
    profile_img?: string;
    verify?: string;
    info?: string;
}

/** 앱 모델 `com.dcinside.app.totalsearch.a` */
export interface SearchResponse {
    result?: string;
    cause?: string;
    info?: SearchResponseInfo[];
    gall_list?: SearchResponseGall[];
    recomm_list?: SearchResponseGall[];
    list?: SearchResponseGall[];
    board?: SearchResponseGall[];
    wiki?: SearchResponseGall[];
    movie?: SearchResponseGall[];
    is_adult_keyword?: boolean;
    is_illegal_keyword?: boolean;
    gall_cnt?: number;
    allowFlag?: boolean;
}

// ── 알림 ────────────────────────────────────────────────────────────────────

/** 앱 모델 `T.d.a` */
export interface AlarmMessageListList {
    idx?: string;
    title?: string;
    message?: string;
    gallery_id?: string;
    content_no?: string;
    comment_content?: string;
    writer_nick?: string;
    alarm_type?: string;
    gall_ko_name?: string;
    comment_cnt?: number;
    regdate?: string;
    type?: string;
    user_id?: string;
    ip?: string;
    comment_nick?: string;
    comment_no?: number;
}

/** 앱 모델 `T.d` */
export interface AlarmMessageList {
    lists?: AlarmMessageListList[];
}

/** 앱 모델 `T.e` */
export interface ArticleAlarmConfig {
    self_article?: boolean;
    article?: boolean;
    user?: boolean;
}

/** 앱 모델 `T.f.d` */
export interface KeywordAlarmSubscriptionsListsUser {
    user_id?: string;
    nickname?: string;
}

/** 앱 모델 `T.f.b` */
export interface KeywordAlarmSubscriptionsLists {
    id?: string;
    ko_name?: string;
    keyword?: string[];
    idx?: number;
    content_no?: string;
    title?: string;
    nickname?: string;
    reg_date?: string;
    article_type?: string;
    comment_no?: string;
    type?: string;
    user?: KeywordAlarmSubscriptionsListsUser[];
}

/** 앱 모델 `T.f` */
export interface KeywordAlarmSubscriptions {
    lists?: Record<string, KeywordAlarmSubscriptionsLists>;
    total?: number;
}

/** 앱 모델 `T.f.c` */
export interface AlarmSubscriptions {
    lists?: KeywordAlarmSubscriptionsLists[];
    total?: number;
}

/** 앱 모델 `com.dcinside.app.model.Y` */
export interface AlarmSetting {
    use_yn?: number;
    keyword?: number;
    keyword_cnt?: number;
    recomm?: number;
    recomm_cnt?: number;
    attention?: number;
    article_cnt?: number;
    activity?: number;
    notify?: number;
    notify_cnt?: number;
    user?: number;
    user_cnt?: number;
    recomm_article?: number;
    pum?: number;
    img_comment?: number;
}

/** 앱 모델 `com.dcinside.app.model.K` */
export interface MinorNotificationResponseDataAppoint {
    id?: string;
    Is_adult?: string;
    Is_sex?: string;
    ko_name?: string;
    reg_dt?: string;
    status?: string;
}

/** 앱 모델 `com.dcinside.app.model.L` */
export interface MinorNotificationResponseDataBefired {
    id?: string;
    memo?: string;
    no?: number;
    reg_dt?: string;
}

/** 앱 모델 `com.dcinside.app.model.M` */
export interface MinorNotificationResponseData {
    appoint?: MinorNotificationResponseDataAppoint[];
    befired?: MinorNotificationResponseDataBefired[];
}

/** 앱 모델 `com.dcinside.app.model.N` */
export interface MinorNotificationResponse extends ApiResult {
    data?: MinorNotificationResponseData;
}

// ── 사용자 ───────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.model.B` */
export interface MyGalleryResponseMygall {
    gall_id?: string;
    gall_koname?: string;
    gall_hide?: number;
    is_mini?: boolean;
    is_person?: boolean;
}

/** 앱 모델 `com.dcinside.app.model.C` */
export interface MyGalleryResponse extends ApiResult {
    favori?: MyGalleryResponseMygall[];
    mygall?: MyGalleryResponseMygall[];
}

/** 앱 모델 `com.dcinside.app.model.I` */
export interface ManagedGalleryMymanage {
    gall_id?: string;
    gall_koname?: string;
    gall_type?: string;
    manager_type?: string;
    gall_hide?: number;
    transfer?: string;
}

/** 앱 모델 `com.dcinside.app.response.e` */
export interface ManagedGallery extends ApiResult {
    mymanageList?: ManagedGalleryMymanage[];
}

/** 앱 모델 `com.dcinside.app.response.h` */
export interface JoinedMiniGalleries extends ApiResult {
    myjoinmini_hold?: MyGalleryResponseMygall[];
    myjoinmini_out?: MyGalleryResponseMygall[];
    myjoinmini_in?: MyGalleryResponseMygall[];
}

/** 앱 모델 `com.dcinside.app.response.c` */
export interface MiniGalleryJoinResponse extends ApiResult {
    join_question?: string;
}

/** 앱 모델 `com.dcinside.app.response.d` */
export interface MiniGalleryJoinConfirmResult extends ApiResult {
    status?: string;
}

/** 앱 모델 `com.dcinside.app.model.C2682n` */
export interface HitconSettingResult {
    result?: string;
    cause?: string;
    best_galler?: string;
}

/** 앱 모델 `com.dcinside.app.response.ScrapFolder` */
export interface ScrapFolder {
    no?: number;
    name?: string;
}

/** 앱 모델 `com.dcinside.app.response.p` */
export interface ScrapFolderList {
    result?: boolean;
    cause?: string;
    folder_list?: ScrapFolder[];
}

/** 앱 모델 `com.dcinside.app.response.s` */
export interface ScrapFolderResult {
    result?: boolean;
    cause?: string;
}

/** 앱 모델 `com.dcinside.app.response.r` */
export interface ScrapShareResult {
    result?: string;
    cause?: string;
    isScrap?: boolean;
    recent_folder?: number;
    recent_name?: string;
    folder?: ScrapFolder[];
}

/** 앱 모델 `com.dcinside.app.response.q` */
export interface ScrapShareMultiResult {
    result?: boolean;
    cause?: string;
    scrap?: number[];
    folder?: ScrapFolder[];
}

// ── 디시콘 ───────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.model.C2689v` */
export interface DCConListResponseTab {
    package_idx?: number;
    title?: string;
    img?: string;
}

/** 앱 모델 `com.dcinside.app.model.C2687t` */
export interface DCConItem extends ApiResult {
    package_idx?: number;
    title?: string;
    img?: string;
    fav?: number;
    detail_idx?: number;
}

/** 앱 모델 `com.dcinside.app.model.C2688u` */
export interface DCConListResponse {
    result?: string;
    cause?: string;
    tab?: DCConListResponseTab[];
    list?: DCConItem[][];
    hasFav?: boolean;
}

/** 앱 모델 `com.dcinside.app.model.C2685q.b` */
export interface DCConPackageDetailInfo {
    package_idx?: string;
    main_img?: string;
    title?: string;
    description?: string;
    mandu?: string;
    get_state?: string;
    seller_name?: string;
    reg_date?: string;
}

/** 앱 모델 `com.dcinside.app.model.C2685q.a` */
export interface DCConPackageDetailDetail {
    img?: string;
}

/** 앱 모델 `com.dcinside.app.model.C2685q` */
export interface DCConPackageDetail {
    result?: boolean;
    cause?: string;
    info?: DCConPackageDetailInfo[];
    detail?: DCConPackageDetailDetail[];
}

/** 앱 모델 `com.dcinside.app.model.C2692y` */
export interface DCConBuyResult extends ApiResult {
    code?: string;
}

/** 앱 모델 `com.dcinside.app.model.C2691x` */
export interface DCConInsertResult extends ApiResult {
    alt?: string;
    img_tag?: string;
    img_src?: string;
}

/** 앱 모델 `com.dcinside.app.response.b` */
export interface DCConSettingList extends ApiResult {
    unuse_list?: DCConItem[];
    use_list?: DCConItem[];
}

/** 앱 모델 `com.dcinside.app.model.BigDcconResult` */
export interface BigDCConResult {
    article_cnt?: number;
    comment_cnt?: number;
    result_status?: string;
    result?: boolean;
    cause?: string;
    expire?: number;
    article_limit?: number;
    comment_limit?: number;
    day_limit?: number;
}

/** 앱 모델 `com.dcinside.app.model.A` */
export interface DCConFolderResult {
    result?: string;
    cause?: string;
    message?: string;
}

/** 앱 모델 `com.dcinside.app.model.r` */
export interface DCConFolderListTab {
    name?: string;
    hide?: number;
}

/** 앱 모델 `com.dcinside.app.model.C2686s` */
export interface DCConFolderList {
    result?: string;
    cause?: string;
    tab?: DCConFolderListTab[];
    list?: DCConItem[][];
}

// ── 업로드 ───────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.model.VideoUploadResult` */
export interface VideoUploadResult {
    msg?: string;
    file_no?: string;
    thum_url_arr?: string[];
    width?: number;
    height?: number;
}

/** 앱 모델 `com.dcinside.app.model.VideoInfoUploadResult` */
export interface VideoInfoResult {
    result?: string;
    cause?: string;
    mv_token?: string;
    mv_no?: string;
}

/** 앱 모델 `com.dcinside.app.model.n0` */
export interface VoiceDownloadResult {
    result?: boolean;
    cause?: string;
    download?: string;
    gall?: string;
    name?: string;
    title?: string;
}

// ── 자동짤 ───────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.settings.image.model.AutoImage` */
export interface AutoImage {
    thumb?: string;
    idx?: number;
    img?: string;
    extension?: string;
}

/** 앱 모델 `X.a` */
export interface AutoImageList extends ApiResult {
    ko_name?: string;
    random?: string;
    use?: string;
    main_image?: number;
    imgInfo?: AutoImage[];
    id?: string;
}

/** 앱 모델 `X.b` */
export interface AutoImageSettingResult extends ApiResult {
    main_image?: number;
    random?: string;
    use?: string;
    gallery_id?: string;
}

/** 앱 모델 `X.c` */
export interface AutoImageGalleryListImgInfo {
    id?: string;
    ko_name?: string;
    random?: string;
    use?: string;
    main_image?: number;
    images?: AutoImage[];
}

/** 앱 모델 `X.d` */
export interface AutoImageGalleryList extends ApiResult {
    imgInfo?: AutoImageGalleryListImgInfo[];
}

/** 앱 모델 `X.e` */
export interface AutoImageUploadResult extends ApiResult {
    imgInfo?: AutoImage[];
}

// ── AI 이미지 ────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.write.menu.ai.type.LoraModel` */
export interface LoraModel {
    add_prompt?: string;
    image_src?: string;
    name?: string;
    idx?: number;
    promptAccent?: string;
    type?: string;
    prompt_type?: string;
    default?: string;
    prompt?: string;
}

/** 앱 모델 `com.dcinside.app.write.menu.ai.type.AiSampleList` */
export interface AiSampleList {
    ani?: string[];
    real?: string[];
}

/** 앱 모델 `com.dcinside.app.model.AiImageStatusResult` */
export interface AiImageStatus {
    styles?: string[];
    lora_list?: Record<string, LoraModel>;
    models?: Record<string, string>;
    result?: boolean;
    generate_cnt?: number;
    set_cnt?: number;
    prompts?: string[];
    samples?: AiSampleList;
}

/** 앱 모델 `com.dcinside.app.model.C2675g` */
export interface AiImageInsertResult {
    result?: boolean;
    msg?: string;
    data?: string;
    ct_img?: string;
    limit?: boolean;
}

/** 앱 모델 `com.dcinside.app.model.AiPromptLoadItem` */
export interface AiPromptLoadItem {
    idx?: number;
    mno?: number;
    title?: string;
    prompt?: string;
    negative_prompt?: string;
}

/** 앱 모델 `com.dcinside.app.model.C2679k` */
export interface AiPromptListResult {
    result?: boolean;
    msg?: string;
    prompt_list?: AiPromptLoadItem[];
    list_cnt?: number;
}

/** 앱 모델 `com.dcinside.app.model.C2681m` */
export interface AiResampleResult {
    result?: boolean;
    msg?: string;
    filename?: string;
}

/** 앱 모델 `com.dcinside.app.model.C2680l` */
export interface AiFillPromptsResult {
    result?: boolean;
    prompts?: string;
    msg?: string;
}

/** 앱 모델 `com.dcinside.app.write.menu.ai.type.c` */
export interface AiCharacterPromptResultData {
    name?: string;
    prompt?: string;
}

/** 앱 모델 `com.dcinside.app.write.menu.ai.type.b` */
export interface AiCharacterPromptResult {
    result?: boolean;
    data?: AiCharacterPromptResultData[];
}

// ── 앱 ─────────────────────────────────────────────────────────────────────

/** 앱 모델 `com.dcinside.app.model.C2669a` */
export interface AppCheck {
    result?: boolean;
    cause?: string;
    ver?: string;
    notice?: boolean;
    notice_update?: boolean;
    gall_id?: string;
    date?: string;
    force?: boolean;
}

/** 앱 모델 `com.dcinside.app.model.l0` */
export interface AppUpdateNotice {
    ver?: string;
    notice?: string;
}

/** 앱 모델 `com.dcinside.app.model.Q` */
export interface AppNotice {
    notice?: string;
    memo2?: string;
}

/** `Http`의 `as` 옵션에 쓰는 응답 이름과 타입입니다. */
export interface ResponseMap {
    ApiResult: ApiResult;
    LoginResult: LoginResult;
    ArticleListResponse: ArticleListResponse;
    ArticleViewResponse: ArticleViewResponse;
    ArticleImage: ArticleImage;
    ArticleModifyInfo: ArticleModifyInfo;
    ArticleDeleteResult: ArticleDeleteResult;
    ArticleVoteResult: ArticleVoteResult;
    RelatedGalleryArticles: RelatedGalleryArticles;
    OgLink: OgLink;
    ArticleTransferResult: ArticleTransferResult;
    PollFinishResult: PollFinishResult;
    CommentListResponse: CommentListResponse;
    CommentSearchResponse: CommentSearchResponse;
    GalleryIntro: GalleryIntro;
    PersonGalleryProfile: PersonGalleryProfile;
    UserGallogCount: UserGallogCount;
    GalleryRankInfo: GalleryRankInfo;
    MajorGalleryRanking: MajorGalleryRanking;
    MinorGalleryRanking: MinorGalleryRanking;
    RecommendArticle: RecommendArticle;
    MainContent: MainContent;
    LiveBestArticle: LiveBestArticle;
    GalleryCategory: GalleryCategory;
    GalleryNameEntry: GalleryNameEntry;
    PumGalleryInfo: PumGalleryInfo;
    PumHistory: PumHistory;
    ManageHistoryResponse: ManageHistoryResponse;
    ManagerInfo: ManagerInfo;
    ManagerEntrustResult: ManagerEntrustResult;
    ManagerAppointResult: ManagerAppointResult;
    ManagerActionResult: ManagerActionResult;
    SearchResponse: SearchResponse;
    AlarmMessageList: AlarmMessageList;
    ArticleAlarmConfig: ArticleAlarmConfig;
    KeywordAlarmSubscriptions: KeywordAlarmSubscriptions;
    AlarmSubscriptions: AlarmSubscriptions;
    AlarmSetting: AlarmSetting;
    MinorNotificationResponse: MinorNotificationResponse;
    MyGalleryResponse: MyGalleryResponse;
    ManagedGallery: ManagedGallery;
    JoinedMiniGalleries: JoinedMiniGalleries;
    MiniGalleryJoinResponse: MiniGalleryJoinResponse;
    MiniGalleryJoinConfirmResult: MiniGalleryJoinConfirmResult;
    HitconSettingResult: HitconSettingResult;
    ScrapFolderList: ScrapFolderList;
    ScrapFolderResult: ScrapFolderResult;
    ScrapShareResult: ScrapShareResult;
    ScrapShareMultiResult: ScrapShareMultiResult;
    DCConListResponse: DCConListResponse;
    DCConItem: DCConItem;
    DCConPackageDetail: DCConPackageDetail;
    DCConBuyResult: DCConBuyResult;
    DCConInsertResult: DCConInsertResult;
    DCConSettingList: DCConSettingList;
    BigDCConResult: BigDCConResult;
    DCConFolderResult: DCConFolderResult;
    DCConFolderList: DCConFolderList;
    VideoUploadResult: VideoUploadResult;
    VideoInfoResult: VideoInfoResult;
    VoiceDownloadResult: VoiceDownloadResult;
    AutoImageList: AutoImageList;
    AutoImageSettingResult: AutoImageSettingResult;
    AutoImageGalleryList: AutoImageGalleryList;
    AutoImageUploadResult: AutoImageUploadResult;
    AiImageStatus: AiImageStatus;
    AiImageInsertResult: AiImageInsertResult;
    AiPromptListResult: AiPromptListResult;
    AiResampleResult: AiResampleResult;
    AiFillPromptsResult: AiFillPromptsResult;
    AiCharacterPromptResult: AiCharacterPromptResult;
    AppCheck: AppCheck;
    AppUpdateNotice: AppUpdateNotice;
    AppNotice: AppNotice;
}
