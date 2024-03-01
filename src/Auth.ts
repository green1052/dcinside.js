import {Dcinside} from "./Dcinside.js";
import AnonymousUser from "./user/AnonymousUser.js";
import * as cheerio from "cheerio";
import {serialize} from "./util/serialize.js";

export class Auth {
    constructor(private readonly dcinside: Dcinside) {
    }

    /**
     * 로그인
     * @returns 성공 여부
     */
    public async login(): Promise<boolean> {
        if (this.dcinside.user instanceof AnonymousUser) {
            return false;
        }

        const response = await this.dcinside.client.get("https://sign.dcinside.com/login");
        const $ = cheerio.load(response.body);

        await this.dcinside.client.post("https://sign.dcinside.com/login/member_check", {
            form: serialize($("form").serializeArray())
        });

        return true;
    }

    /**
     * 로그아웃
     * @returns 성공 여부
     */
    public async logout(): Promise<boolean> {
        if (this.dcinside.user instanceof AnonymousUser) {
            return false;
        }

        await this.dcinside.client.get("https://sign.dcinside.com/logout");
        return true;
    }
}