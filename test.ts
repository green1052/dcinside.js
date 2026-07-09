import {DCInsideClient} from "./src";


const client = new DCInsideClient();
client.auth.importCredentials(
    {
        "androidId": "4163220422929704735",
        "securityToken": "6933130750761033930",
        "fid": "cZoPnJ3X5wO2LvhFh-RHHD",
        "refreshToken": "3_AS3qfwL82MRw73M0FtNGaBYiPuBcqWKY2S268Hx09Q5xEVSexQeyNh8xa83rSkRxpGn7_P4TVlMQb-7XPDKTdY_1BzGrcL6bP9a9AU2cbaZTS_o",
        "clientToken": "cZoPnJ3X5wO2LvhFh-RHHD:APA91bH03GFyFc5uboAC9QaQ70mX33MMMG89GxgdKmxFC4hQHGNwEpRRtmzAdpc_3wc0uyKpVftOgaKGmjlB02WE7CwV_L-kynAK-OWXsxcmBwq0EPX3ua8",
        "appId": "cUVkSGZHdVZRSGtyUC8zcTMwVmVnREIzSVJlVW5lT1poRWdSQXRnWjV1OD0=",
        "appIdIssuedAt": 1783067664948,
        "appCheckDate": "Fri1833552770307",
        "lastAppCheckTime": 1783067658298
    }
);


const gallery = await client.gallery("bser");

setInterval(async() => {
    const list =await gallery.articles.list();

    for (const article of list.articles) {
        const a = gallery.article(article.id);
        console.log(await a.read());
    }
}, 1500);


console.log(client.auth.exportCredentials());