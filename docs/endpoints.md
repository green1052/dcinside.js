# 엔드포인트 목록

각 메서드가 실제로 호출하는 앱 엔드포인트입니다. 앱 5.3.6 기준입니다.

## `dc.articles`

| 메서드 | 엔드포인트 |
| --- | --- |
| `articles.list()` | `GET app.dcinside.com/api/gall_list_new.php` |
| `articles.pages()` | `(위 메서드 사용)` |
| `articles.read()` | `GET app.dcinside.com/api/gall_view_new.php` |
| `articles.images()` | `GET app.dcinside.com/api/view_img.php` |
| `articles.write()` | `POST upload.dcinside.com/_app_write_api.php` |
| `articles.modifyInfo()` | `POST app.dcinside.com/api/gall_modify.php` |
| `articles.delete()` | `POST app.dcinside.com/api/gall_del.php` |
| `articles.upvote()` | `POST app.dcinside.com/api/_recommend_up.php` |
| `articles.downvote()` | `POST app.dcinside.com/api/_recommend_down.php` |
| `articles.hitRecommend()` | `POST app.dcinside.com/api/hit_recommend` |
| `articles.bestRecommend()` | `POST app.dcinside.com/bestcontent/recommend` |
| `articles.related()` | `POST app.dcinside.com/api/relation_list.php` |
| `articles.linkPreview()` | `POST app.dcinside.com/api/oglink` |
| `articles.transferInfo()` | `POST app.dcinside.com/api/my_transfer` |
| `articles.cancelTransfer()` | `POST app.dcinside.com/api/cancel_transfer` |
| `articles.reportUrl()` | `URL m.dcinside.com/api/report.php` |
| `articles.createPoll()` | `POST upload.dcinside.com/_app_vote_upload.php` |
| `articles.modifyPoll()` | `POST app.dcinside.com/api/votemodify` |
| `articles.finishPoll()` | `POST m.dcinside.com/poll/finish` |

## `dc.comments`

| 메서드 | 엔드포인트 |
| --- | --- |
| `comments.list()` | `GET app.dcinside.com/api/comment_new.php` |
| `comments.pages()` | `(위 메서드 사용)` |
| `comments.imageComments()` | `GET app.dcinside.com/api/img_comment_list` |
| `comments.search()` | `GET app.dcinside.com/api/search_comment` |
| `comments.write()` | `POST app.dcinside.com/api/comment_ok.php` |
| `comments.reply()` | `(위 메서드 사용)` |
| `comments.writeVoice()` | `POST upload.dcinside.com/_app_upload.php` |
| `comments.delete()` | `POST app.dcinside.com/api/comment_del.php` |

## `dc.galleries`

| 메서드 | 엔드포인트 |
| --- | --- |
| `galleries.info()` | `POST app.dcinside.com/api/minor_info` (메인: `gall_info`) |
| `galleries.personProfile()` | `GET app.dcinside.com/api/person_profile` |
| `galleries.gallogCount()` | `GET app.dcinside.com/api/usergallogcnt` |
| `galleries.rank()` | `GET app.dcinside.com/api/gallery_rank` |
| `galleries.ranking()` | `GET json2.dcinside.com/json1/ranking_gallery.php`, `json1/{m,mi,pr}gallmain/*_ranking.php` |
| `galleries.hot()` | `GET json.dcinside.com/json0/gallmain/gallery_hot_day.php` 외 `*_hot.php` |
| `galleries.recommended()` | `GET json2.dcinside.com/json1/recommend/recommend_{…}.php` |
| `galleries.main()` | `GET json2.dcinside.com/json3/main_content.php` |
| `galleries.liveBest()` | `GET app.dcinside.com/bestcontent/livebest` |
| `galleries.categories()` | `GET json2.dcinside.com/json3/category_name.php` |
| `galleries.names()` | `GET json2.dcinside.com/json3/gall_name.php` |
| `galleries.pumInfo()` | `GET app.dcinside.com/api/pum/gall_info` |
| `galleries.pumHistory()` | `GET app.dcinside.com/api/pum/history` |
| `galleries.uploadRestriction()` | `GET app.dcinside.com/api/chk_upload_restriction` |

## `dc.search`

| 메서드 | 엔드포인트 |
| --- | --- |
| `search.search()` | `POST app.dcinside.com/api/_total_search_new.php` |

## `dc.notifications`

| 메서드 | 엔드포인트 |
| --- | --- |
| `notifications.messages()` | `GET app.dcinside.com/api/alarm/message` |
| `notifications.messagePages()` | `(위 메서드 사용)` |
| `notifications.deleteMessages()` | `POST app.dcinside.com/api/alarm/del_message` |
| `notifications.deleteAllMessages()` | `POST app.dcinside.com/api/alarm/del_all_message` |
| `notifications.restoreMessages()` | `POST app.dcinside.com/api/alarm/restore` |
| `notifications.settings()` | `GET app.dcinside.com/api/alarm/setting` |
| `notifications.updateSettings()` | `POST app.dcinside.com/api/alarm/setting` |
| `notifications.setReceive()` | `POST app.dcinside.com/api/alarm/receive` |
| `notifications.articleConfig()` | `GET app.dcinside.com/api/alarm/get_article_config` |
| `notifications.articles()` | `GET app.dcinside.com/api/alarm/article` |
| `notifications.subscribeArticle()` | `POST app.dcinside.com/api/alarm/article` |
| `notifications.unsubscribeArticle()` | `POST app.dcinside.com/api/alarm/del_article` |
| `notifications.users()` | `GET app.dcinside.com/api/alarm/user` |
| `notifications.subscribeUser()` | `POST app.dcinside.com/api/alarm/user` |
| `notifications.unsubscribeUser()` | `POST app.dcinside.com/api/alarm/del_user` |
| `notifications.keywords()` | `GET app.dcinside.com/api/alarm/keyword` |
| `notifications.subscribeKeyword()` | `POST app.dcinside.com/api/alarm/keyword` |
| `notifications.unsubscribeKeyword()` | `POST app.dcinside.com/api/alarm/del_keyword` |
| `notifications.unsubscribeAllKeywords()` | `POST app.dcinside.com/api/alarm/del_keyword_all` |
| `notifications.recommends()` | `GET app.dcinside.com/api/alarm/recomm` |
| `notifications.subscribeRecommend()` | `POST app.dcinside.com/api/alarm/recomm` |
| `notifications.unsubscribeRecommend()` | `POST app.dcinside.com/api/alarm/del_recomm` |
| `notifications.notices()` | `GET app.dcinside.com/api/alarm/notify` |
| `notifications.subscribeNotice()` | `POST app.dcinside.com/api/alarm/notify` |
| `notifications.unsubscribeNotice()` | `POST app.dcinside.com/api/alarm/del_notify` |
| `notifications.subscribeComment()` | `POST app.dcinside.com/api/comment_del.php` |
| `notifications.minorNotification()` | `POST app.dcinside.com/alarm/minor-notification` |
| `notifications.confirmMinorNotification()` | `POST app.dcinside.com/alarm/minor-notificationconfirm` |

## `dc.user`

| 메서드 | 엔드포인트 |
| --- | --- |
| `user.myGalleries()` | `POST app.dcinside.com/api/mygall.php` |
| `user.addFavorite()` | `POST app.dcinside.com/api/mygall_modify.php` |
| `user.sortFavorites()` | `POST app.dcinside.com/api/mygall_modify.php` |
| `user.clearFavorites()` | `POST app.dcinside.com/api/mygall_modify.php` |
| `user.managedGalleries()` | `POST app.dcinside.com/api/mymanageGallChk` |
| `user.joinedMiniGalleries()` | `POST app.dcinside.com/api/myminijoinGallChk` |
| `user.joinMini()` | `POST app.dcinside.com/api/memberjoin` |
| `user.confirmMiniJoin()` | `POST app.dcinside.com/api/memberjoin_ok` |
| `user.cancelMiniJoin()` | `POST app.dcinside.com/api/memberjoincancel` |
| `user.quitMini()` | `POST app.dcinside.com/api/memberout_ok` |
| `user.hitcon()` | `POST m.dcinside.com/aside/usehitcon` |
| `user.scrapFolders()` | `POST app.dcinside.com/api/scrap-folder` |
| `user.editScrapFolder()` | `POST app.dcinside.com/api/edit-scrap-folder` |
| `user.deleteScrapFolder()` | `POST app.dcinside.com/api/delete-scrap-folder` |
| `user.sortScrapFolder()` | `POST app.dcinside.com/api/sort-scrap-folder` |
| `user.moveScrap()` | `POST app.dcinside.com/api/move-scrap` |
| `user.addScrap()` | `POST app.dcinside.com/api/share-scrap` |
| `user.addScraps()` | `POST app.dcinside.com/api/share-scrap-multi` |
| `user.deleteScrap()` | `POST app.dcinside.com/api/del-scrap` |

## `dc.management`

| 메서드 | 엔드포인트 |
| --- | --- |
| `management.setNotice()` | `POST app.dcinside.com/api/_manager_request.php` |
| `management.setRecommend()` | `POST app.dcinside.com/api/_manager_request.php` |
| `management.bump()` | `POST app.dcinside.com/api/_manager_request.php` |
| `management.changeHeadText()` | `POST app.dcinside.com/api/_manager_request.php` |
| `management.reorderNotices()` | `POST app.dcinside.com/api/_manager_request.php` |
| `management.fixToday()` | `POST app.dcinside.com/api/fixtoday` |
| `management.blockImage()` | `POST app.dcinside.com/management/{minor,mini,person}/blockImg/{id}` |
| `management.clearImageBlock()` | `POST app.dcinside.com/management/{minor,mini,person}/blockImgClear/{id}` |
| `management.history()` | `POST app.dcinside.com/api/managehistory` |
| `management.managerInfo()` | `POST app.dcinside.com/api/manager_info` |
| `management.entrust()` | `POST app.dcinside.com/api/manager_entrust` |
| `management.respondAppointment()` | `POST app.dcinside.com/minor/minor-appointagreemanager` |
| `management.blockUser()` | `POST app.dcinside.com/api/minor_avoidadd` |
| `management.blockNoMember()` | `POST m.dcinside.com/management/minor/nomember/{…}` |
| `management.settingsUrl()` | `URL m.dcinside.com/management/{minor,mini,person}/main/{id}` (메인: `gall.dcinside.com/management/mobile`) |
| `management.blockUserUrl()` | `URL m.dcinside.com/api/minor_avoid` |

## `dc.dccons`

| 메서드 | 엔드포인트 |
| --- | --- |
| `dccons.list()` | `POST app.dcinside.com/api/dccon.php (type=list)` |
| `dccons.recent()` | `POST app.dcinside.com/api/dccon.php (type=recent)` |
| `dccons.detail()` | `POST app.dcinside.com/api/dccon.php (type=package_detail)` |
| `dccons.buy()` | `POST app.dcinside.com/api/dccon.php (type=buy_dccon)` |
| `dccons.insert()` | `POST app.dcinside.com/api/dccon.php (type=insert)` |
| `dccons.settings()` | `POST app.dcinside.com/api/dccon.php (type=setting)` |
| `dccons.saveSettings()` | `POST app.dcinside.com/api/dccon.php (type=setting_save)` |
| `dccons.bigDccon()` | `POST app.dcinside.com/api/dccon.php (type=chk_bigdccon)` |
| `dccons.deletePackages()` | `POST app.dcinside.com/api/dccon/del` |
| `dccons.folders()` | `GET app.dcinside.com/api/dccon/folder` |
| `dccons.addFolder()` | `POST app.dcinside.com/api/dccon/folder/add` |
| `dccons.deleteFolder()` | `POST app.dcinside.com/api/dccon/folder/del` |
| `dccons.updateFolder()` | `POST app.dcinside.com/api/dccon/folder/update` |
| `dccons.updateFolderList()` | `POST app.dcinside.com/api/dccon/folder/update-list` |
| `dccons.addToFolder()` | `POST app.dcinside.com/api/dccon/folder-item/add` |
| `dccons.removeFromFolder()` | `POST app.dcinside.com/api/dccon/folder-item/del` |

## `dc.uploads`

| 메서드 | 엔드포인트 |
| --- | --- |
| `uploads.images()` | `POST upload.dcinside.com/upload_img_auto.php` |
| `uploads.movie()` | `POST m4up4.dcinside.com/movie_upload_v1.php` |
| `uploads.movieInfo()` | `POST app.dcinside.com/movie/insert-mvinfo` |
| `uploads.modifyMovieInfo()` | `POST app.dcinside.com/movie/modify-mvinfo` |
| `uploads.voice()` | `POST upload.dcinside.com/_app_vr_board.php` |
| `uploads.voiceDownload()` | `POST m.dcinside.com/voice/download` |

## `dc.autoImages`

| 메서드 | 엔드포인트 |
| --- | --- |
| `autoImages.list()` | `GET app.dcinside.com/api/autozzal/list` |
| `autoImages.galleries()` | `GET app.dcinside.com/api/autozzal/my_list` |
| `autoImages.myImages()` | `GET app.dcinside.com/api/autozzal/my_list` |
| `autoImages.setting()` | `POST app.dcinside.com/api/autozzal/setting` |
| `autoImages.setMain()` | `POST app.dcinside.com/api/autozzal/main_image` |
| `autoImages.add()` | `POST app.dcinside.com/api/autozzal/insert` |
| `autoImages.remove()` | `POST app.dcinside.com/api/autozzal/delete` |
| `autoImages.removeMine()` | `POST app.dcinside.com/api/autozzal/my_delete` |

## `dc.ai`

| 메서드 | 엔드포인트 |
| --- | --- |
| `ai.status()` | `POST app.dcinside.com/recom_prompt_new` |
| `ai.generate()` | `POST app.dcinside.com/insert_aiImg` |
| `ai.prompts()` | `POST app.dcinside.com/prompt_list` |
| `ai.savePrompt()` | `POST app.dcinside.com/save_prompt` |
| `ai.deletePrompt()` | `POST app.dcinside.com/del_prompt_list` |
| `ai.characterPrompt()` | `POST app.dcinside.com/character_prompt` |
| `ai.resample()` | `POST upload.dcinside.com/_app_aiImg_resample_upload.php` |
| `ai.fillPrompts()` | `POST upload.dcinside.com/_app_aiImg_fill_prompts.php` |

## `dc.app`

| 메서드 | 엔드포인트 |
| --- | --- |
| `app.check()` | `GET json2.dcinside.com/json0/app_check_A_rina_one_new.php` |
| `app.updateNotice()` | `GET json2.dcinside.com/json0/update_notice_A_rina_one_new.php` |
| `app.notice()` | `GET json2.dcinside.com/json0/app_dc_notice_one_new.php` |

## 인증

| 단계 | 엔드포인트 |
| --- | --- |
| checkin | `POST android.clients.google.com/checkin` |
| Firebase | `POST firebaseinstallations.googleapis.com/v1/projects/dcinside-b3f40/installations` |
| GCM | `POST android.apis.google.com/c2dm/register3` |
| 날짜 토큰 | `GET json2.dcinside.com/json0/app_check_A_rina_one_new.php` |
| app_id | `POST msign.dcinside.com/auth/mobile_app_verification` |
| 로그인 | `POST msign.dcinside.com/api/login` |
