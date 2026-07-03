import {describe, expect, test} from "bun:test";
import {DCInsideClient} from "../src";

const testCredentials = {
    androidId: "1",
    securityToken: "2",
    fid: "test-fid",
    refreshToken: "test-refresh-token",
    clientToken: "client-token",
    appId: "app-id",
    appIdIssuedAt: Date.now(),
    appCheckDate: "20260703",
    lastAppCheckTime: Date.now()
} as const;

describe("DCInsideClient", () => {
    test("creates discord.js-style managers", () => {
        const client = new DCInsideClient();

        expect(client.dccons).toBeDefined();
        expect(client.galleries).toBeDefined();
        expect(client.management).toBeDefined();
        expect(client.search).toBeDefined();
        expect(client.user).toBeDefined();
    });

    test("stores raw gallery keys in gallery scopes", () => {
        const client = new DCInsideClient();

        expect(client.gallery("football_new9").gallery).toBe("football_new9");
        expect(client.gallery("mi$bjwg64").gallery).toBe("mi$bjwg64");
        expect(client.gallery("pr$dororong").gallery).toBe("pr$dororong");
    });

    test("stores anonymous sessions and exposes currentUser", () => {
        const client = new DCInsideClient();
        const session = client.useAnonymous("nick", "pass");

        expect(client.session).toBe(session);
        expect(client.currentUser).toEqual({
            type: "anonymous",
            id: "nick",
            password: "pass"
        });
    });

    test("useSession sets the current session", () => {
        const client = new DCInsideClient();
        const session = client.useAnonymous("nick", "pass");

        client.useSession(session);

        expect(client.session).toBe(session);
        expect(client.currentUser).toEqual({
            type: "anonymous",
            id: "nick",
            password: "pass"
        });
    });

    test("currentUser is null when no session is set", () => {
        const client = new DCInsideClient();

        expect(client.session).toBeNull();
        expect(client.currentUser).toBeNull();
    });

    test("exposes auth manager and http client", () => {
        const client = new DCInsideClient();

        expect(client.auth).toBeDefined();
        expect(client.http).toBeDefined();
        expect(client.auth.fcmToken).toBeNull();
        expect(client.auth.firebaseInstallationId).toBeNull();
    });

    test("validates article write input before network requests", async () => {
        const client = new DCInsideClient();
        client.useAnonymous("nick", "pass");
        const gallery = client.gallery("mi$bjwg64");

        await expect(gallery.articles.write({
            subject: "   ",
            content: ["body"]
        })).rejects.toThrow("Article subject is required.");

        await expect(gallery.articles.write({
            subject: "subject",
            content: []
        })).rejects.toThrow("Article content must contain at least one block.");

        await expect(gallery.articles.write({
            subject: "subject",
            content: ["body"],
            mode: "modify"
        })).rejects.toThrow("articleId is required");
    });

    test("builds article write fields like the mobile app", async () => {
        const fields: [string, string][] = [];
        const client = new DCInsideClient({
            credentials: testCredentials,
            http: {
                hooks: {
                    beforeRequest: [
                        async ({request}) => {
                            for (const [key, value] of await request.clone().formData()) {
                                fields.push([key, String(value)]);
                            }
                            return new Response("[{\"result\":true,\"cause\":\"123\",\"id\":\"mi$bjwg64\"}]");
                        }
                    ]
                }
            }
        });
        client.http.useDCInsideContext({
            getAppId: async () => "app-id",
            getClientToken: () => "client-token",
            ensureClientToken: async () => "client-token",
            getUserId: () => "user-no"
        });
        client.useSession({
            user: {type: "login", id: "login-id", password: "login-password"},
            detail: {
                result: true,
                userId: "user-no",
                userNo: "user-no",
                name: "nick",
                sessionType: "A",
                isAdult: 0,
                isDormancy: 0,
                isOtp: 0,
                pwCampaign: 0,
                mailSend: "",
                isGonick: 0,
                isSecurityCode: "",
                authChange: 0,
                cause: null
            }
        });
        const gallery = client.gallery("mi$bjwg64");

        const result = await gallery.articles.write({
            subject: "hello world",
            headText: {no: 0, name: "일반"},
            content: [
                "hello world",
                {type: "dccon", imageTag: "<img src=\"x\">", detailIndex: 1380306681}
            ]
        });

        expect(result.articleId).toBe(123);
        expect(fields).toContainEqual(["id", "mi$bjwg64"]);
        expect(fields).toContainEqual(["app_id", "app-id"]);
        expect(fields).toContainEqual(["mode", "write"]);
        expect(fields).toContainEqual(["client_token", "client-token"]);
        expect(fields).toContainEqual(["head_no", "0"]);
        expect(fields).toContainEqual(["subject", "hello+world"]);
        expect(fields).toContainEqual(["user_id", "user-no"]);
        expect(fields).toContainEqual(["memo_block[0]", "%3Cdiv%3Ehello+world%3C%2Fdiv%3E"]);
        expect(fields).toContainEqual(["memo_block[1]", "%3Cimg+src%3D%22x%22%3E"]);
        expect(fields).toContainEqual(["detail_idx[1]", "1380306681"]);
        expect(fields).toContainEqual(["fix", ""]);
        expect(fields).toContainEqual(["secret_use", "0"]);
        expect(fields).toContainEqual(["is_quick", "0"]);
        expect(fields).toContainEqual(["use_gall_nickname", "0"]);
        expect(fields).toContainEqual(["write_movie", "0"]);
        expect(fields.filter(([key]) => key === "user_id")).toHaveLength(1);
    });

    test("scopes gallery and article context for nested APIs", async () => {
        const requests: Array<{ method: string; url: string }> = [];
        const client = new DCInsideClient({
            credentials: testCredentials,
            http: {
                hooks: {
                    beforeRequest: [
                        ({request}) => {
                            requests.push({
                                method: request.method,
                                url: request.url
                            });

                            if (request.url.includes("gall_list_new.php")) {
                                return new Response("{\"gall_info\":{},\"gall_list\":[]}");
                            }

                            return new Response("{\"total_comment\":0,\"total_page\":0,\"re_page\":1,\"comment_list\":[]}");
                        }
                    ]
                }
            }
        });

        const gallery = client.gallery("mi$bjwg64");
        const article = gallery.article(123);

        await gallery.articles.list();
        await article.comments.list();

        const firstUrl = new URL(requests[0]!.url);
        const secondUrl = new URL(requests[1]!.url);
        const firstTarget = Buffer.from(firstUrl.searchParams.get("hash") ?? "", "base64").toString("utf8");
        const secondTarget = Buffer.from(secondUrl.searchParams.get("hash") ?? "", "base64").toString("utf8");

        expect(gallery.gallery).toBe("mi$bjwg64");
        expect(requests[0]?.url).toContain("redirect.php");
        expect(requests[1]?.url).toContain("redirect.php");
        expect(firstTarget).toContain("id=mi%24bjwg64");
        expect(secondTarget).toContain("id=mi%24bjwg64");
        expect(secondTarget).toContain("no=123");
        expect(article.articleId).toBe(123);
    });

    test("accepts a single gallery key in direct manager calls", async () => {
        const requests: string[] = [];
        const client = new DCInsideClient({
            credentials: testCredentials,
            http: {
                hooks: {
                    beforeRequest: [
                        ({request}) => {
                            requests.push(request.url);
                            return new Response("{\"gall_info\":{},\"gall_list\":[]}");
                        }
                    ]
                }
            }
        });

        await client.gallery("krstock").articles.list();

        const redirected = new URL(requests[0]!);
        const target = Buffer.from(redirected.searchParams.get("hash") ?? "", "base64").toString("utf8");
        expect(target).toContain("id=krstock");
    });

    test("maps gall_list_new object responses with gall_info and gall_list arrays", async () => {
        const rawResponse = {
            gall_info: [{
                gall_title: "이터널 리턴",
                category: "21",
                file_cnt: "50",
                file_size: "20971520",
                is_minor: true,
                is_person: true,
                captcha: true,
                code_count: "2",
                use_ai_write: true,
                head_text_up_dt: 1780247964,
                notify_recent: "20251001",
                placeholder: [
                    {no: 0, msg: "기본 안내"},
                    {no: 60, msg: "망호 안내"}
                ],
                must_read: {
                    subject: "이터널 리턴 쿠폰 모음집(26.06.30)",
                    no: 9719379
                },
                anonymous: "ㅇㅇ",
                capture_nickname: "ㅇㅇ",
                gall_nickname: "ㅇㅇ",
                prgall_profile: [
                    {name: "본명", value: "[\"Jon Jones\"]"},
                    {name: "출생일", value: "19870719"}
                ],
                prgall_img: "https://example.com/person.png",
                is_prgall_certified: false,
                profile_img: "https://example.com/profile.png",
                head_text: [
                    {no: "0", name: "일반", level: "0", selected: true, recomm_unused: false},
                    {no: "60", name: "🚢망호", level: "0", selected: false, recomm_unused: true}
                ]
            }],
            gall_list: [{
                no: "11179531",
                headnum: "-11137175",
                hit: "44",
                recommend: "0",
                img_icon: "N",
                movie_icon: "N",
                recommend_icon: "N",
                best_chk: "N",
                realtime_chk: "N",
                realtime_l_chk: "N",
                voice_icon: "N",
                winnerta_icon: "N",
                level: "10",
                total_comment: "0",
                total_voice: "0",
                user_id: "",
                member_icon: "3",
                ip: "210.206",
                subject: "일망호 출격!!ㄹ",
                name: "ㅇㅇ",
                date_time: "17:40",
                headtext: "🚢망호"
            }]
        };
        const client = new DCInsideClient({
            credentials: testCredentials,
            http: {
                hooks: {
                    beforeRequest: [
                        () => new Response(JSON.stringify(rawResponse), {
                            headers: {"content-type": "application/json"}
                        })
                    ]
                }
            }
        });

        const result = await client.gallery("mi$bser").articles.list();

        expect(result.gallery.title).toBe("이터널 리턴");
        expect(result.gallery.isMinor).toBe(true);
        expect(result.gallery.isPerson).toBe(true);
        expect(result.gallery.captcha).toBe(true);
        expect(result.gallery.codeCount).toBe(2);
        expect(result.gallery.useAiWrite).toBe(true);
        expect(result.gallery.notifyRecent).toBe(20251001);
        expect(result.gallery.headTextUpdatedAt).toBe(1780247964);
        expect(result.gallery.placeholders).toEqual([
            {no: 0, message: "기본 안내"},
            {no: 60, message: "망호 안내"}
        ]);
        expect(result.gallery.mustRead).toEqual({
            subject: "이터널 리턴 쿠폰 모음집(26.06.30)",
            articleId: 9719379
        });
        expect(result.gallery.anonymousNickname).toBe("ㅇㅇ");
        expect(result.gallery.captureNickname).toBe("ㅇㅇ");
        expect(result.gallery.galleryNickname).toBe("ㅇㅇ");
        expect(result.gallery.personGalleryImage).toBe("https://example.com/person.png");
        expect(result.gallery.isPersonGalleryCertified).toBe(false);
        expect(result.gallery.personGalleryProfile).toEqual([
            {name: "본명", value: "[\"Jon Jones\"]"},
            {name: "출생일", value: "19870719"}
        ]);
        expect(result.gallery.headTexts).toEqual([
            {no: 0, name: "일반", level: 0, selected: true, recommUnused: false},
            {no: 60, name: "🚢망호", level: 0, selected: false, recommUnused: true}
        ]);
        expect(result.articles).toHaveLength(1);
        expect(result.articles[0]).toMatchObject({
            id: 11179531,
            headNumber: -11137175,
            views: 44,
            hasMovie: false,
            isRealtime: false,
            isRealtimeLatest: false,
            headText: "🚢망호",
            subject: "일망호 출격!!ㄹ",
            ip: "210.206"
        });
    });

    test("maps article read responses with view_info and view_main sections", async () => {
        const rawResponse = [{
            view_info: {
                galltitle: "이터널 리턴",
                category: "21",
                subject: "수비게일 그려옴..",
                no: "11179370",
                name: "ttatti",
                level: "9",
                member_icon: "2",
                total_comment: "14",
                ip: "",
                img_chk: "Y",
                recommend_chk: "Y",
                winnerta_chk: "N",
                voice_chk: "N",
                hit: "999",
                write_type: "V",
                user_id: "rental1612",
                prev_link: "",
                prev_subject: "",
                headtitle: "🎨창작",
                headid: "10",
                next_link: "",
                next_subject: "",
                best_chk: "N",
                realtime_l_chk: "N",
                isNotice: "N",
                date_time: "2026.07.03 17:04",
                alarm_flag: 2,
                gallercon: "https://example.com/gonick.png",
                is_minor: true,
                head_text: [
                    {no: "0", name: "일반", level: "0", selected: true, recomm_unused: false},
                    {no: "10", name: "🎨창작", level: "0", selected: false, recomm_unused: false}
                ],
                comment_captcha: true,
                comment_code_count: "2",
                recommend_captcha: true,
                recommend_captcha_type: "U",
                recommend_code_count: "4",
                anonymous: "ㅇㅇ",
                use_auto_delete: 1,
                use_list_fix: "N",
                capture_nickname: "ㅇㅇ",
                gall_nickname: "ㅇㅇ",
                profile_img: "https://example.com/profile.png"
            },
            view_main: {
                memo: "&lt;p&gt;본문&lt;/p&gt;",
                recommend: "17",
                recommend_member: "15",
                nonrecommend: "0",
                nonrecomm_use: true
            }
        }];
        const client = new DCInsideClient({
            credentials: testCredentials,
            http: {
                hooks: {
                    beforeRequest: [
                        () => new Response(JSON.stringify(rawResponse), {
                            headers: {"content-type": "application/json"}
                        })
                    ]
                }
            }
        });

        const result = await client.gallery("mi$bser").article(11179370).read();

        expect(result.info).toMatchObject({
            galleryTitle: "이터널 리턴",
            subject: "수비게일 그려옴..",
            id: 11179370,
            headTitle: "🎨창작",
            headId: 10,
            views: 999,
            alarmFlag: 2,
            commentCaptcha: true,
            commentCodeCount: 2,
            recommendCaptcha: true,
            recommendCaptchaType: "U",
            recommendCodeCount: 4,
            anonymousNickname: "ㅇㅇ",
            useAutoDelete: 1,
            useListFix: false,
            captureNickname: "ㅇㅇ",
            galleryNickname: "ㅇㅇ",
            profileImage: "https://example.com/profile.png"
        });
        expect(result.info.headTexts).toEqual([
            {no: 0, name: "일반", level: 0, selected: true, recommUnused: false},
            {no: 10, name: "🎨창작", level: 0, selected: false, recommUnused: false}
        ]);
        expect(result.main).toEqual({
            content: "<p>본문</p>",
            upvotes: 17,
            memberUpvotes: 15,
            downvotes: 0,
            nonrecommendEnabled: true,
            isManager: false
        });
    });

    test("maps comment list responses with anonymous and DCCon metadata", async () => {
        const rawResponse = [{
            total_comment: "16",
            total_page: "1",
            re_page: "1",
            comment_list: [
                {
                    nonuser_num: "1",
                    member_icon: "3",
                    ipData: "59.28",
                    name: "ㅇㅇ",
                    user_id: "",
                    comment_memo: "미스릴 &lt; 애매함",
                    comment_no: "38518580",
                    date_time: "2026.07.03 16:53",
                    del_scope: "2"
                },
                {
                    member_icon: "1",
                    ipData: "",
                    name: "로일",
                    user_id: "gflever",
                    comment_memo: "지킴이",
                    dccon: "https://example.com/dccon.png",
                    dccon_detail_idx: "171100",
                    dccon_type: "bigdccon",
                    comment_no: "38518610",
                    date_time: "2026.07.03 16:55"
                }
            ]
        }];
        const client = new DCInsideClient({
            credentials: testCredentials,
            http: {
                hooks: {
                    beforeRequest: [
                        () => new Response(JSON.stringify(rawResponse), {
                            headers: {"content-type": "application/json"}
                        })
                    ]
                }
            }
        });

        const result = await client.gallery("mi$bser").article(11179370).comments.list();

        expect(result.totalComments).toBe(16);
        expect(result.totalPages).toBe(1);
        expect(result.page).toBe(1);
        expect(result.comments[0]).toMatchObject({
            nonuserNumber: 1,
            memberIcon: 3,
            ip: "59.28",
            userId: "",
            id: 38518580,
            deleteScope: 2,
            content: {
                type: "text",
                memo: "미스릴 &lt; 애매함"
            }
        });
        expect(result.comments[1]?.content).toEqual({
            type: "dccon",
            dccon: {
                imgLink: "https://example.com/dccon.png",
                memo: "지킴이",
                detailIndex: 171100,
                type: "bigdccon"
            }
        });
    });

});
