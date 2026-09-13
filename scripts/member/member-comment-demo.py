#!/usr/bin/env python3
import json, os, time, urllib.request, http.cookiejar

BASE="http://localhost:2368"
CKEY=os.environ["CONTENT_KEY"]

def anon():
    o=urllib.request.build_opener()
    o.addheaders=[("Origin",BASE),("User-Agent","lab-seed/1.0"),("Accept","application/json")]
    return o

def call(o, path, method="GET", body=None, headers=None, raw=False):
    data=json.dumps(body).encode() if body is not None else None
    r=urllib.request.Request(BASE+path, data=data, method=method)
    r.add_header("Accept","application/json")
    if data: r.add_header("Content-Type","application/json")
    for k,v in (headers or {}).items(): r.add_header(k,v)
    with o.open(r) as resp:
        txt=resp.read().decode()
        return resp.status, txt

# resolve post ids by title keyword
o=anon()
_,b=call(o, "/ghost/api/content/posts/?key="+CKEY+"&limit=all&fields=id,title,slug")
posts=json.loads(b)["posts"]
def find_id(kw):
    for p in posts:
        if kw in p["title"]: return p["id"], p["title"], p["slug"]
    raise SystemExit("post not found: "+kw)

jobs=[
 ("member1@example.com", "单元测试", "member1 评论：边界值与等价类的断言在本地 Node 里跑通了，0/负数/非法输入三类都覆盖。"),
 ("member2@example.com", "容器化", "member2 评论：docker compose up/logs/down 三条命令已在本地验证，卷映射正常。"),
]

for email, kw, text in jobs:
    print("="*8, email, "->", kw)
    a=anon()
    _,tok=call(a,"/members/api/integrity-token/"); tok=tok.strip().strip('"')
    st,b=call(a,"/members/api/send-magic-link/","POST",
              {"email":email,"emailType":"signin","integrityToken":tok})
    print("  send:",st)
    time.sleep(4)
    mail=json.loads(urllib.request.urlopen("http://127.0.0.1:1080/api/email").read().decode())
    cand=[m for m in mail if any(x.get("address")==email for x in (m.get("to") or []))]
    m=cand[-1]
    import re
    link=re.findall(r'https?://[^\s"\'<>\\]+', m.get("html") or "")
    link=[u for u in link if "action=signin" in u or "members/api/member" in u]
    magic=link[0]
    cj=http.cookiejar.CookieJar()
    mo=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    mo.addheaders=[("Origin",BASE),("User-Agent","lab-seed/1.0")]
    def mcall(path,method="GET",body=None,headers=None):
        data=json.dumps(body).encode() if body is not None else None
        url = path if path.startswith("http") else BASE+path
        r=urllib.request.Request(url,data=data,method=method)
        r.add_header("Accept","application/json")
        if data: r.add_header("Content-Type","application/json")
        for k,v in (headers or {}).items(): r.add_header(k,v)
        with mo.open(r) as resp: return resp.status,resp.read().decode()
    mcall(magic)
    _,me=mcall("/members/api/member/")
    print("  login as:",json.loads(me).get("email"))
    pid,ptitle,pslug=find_id(kw)
    print("  post:",ptitle)
    _,itok=mcall("/members/api/integrity-token/"); itok=itok.strip().strip('"')
    st,b=mcall("/members/api/comments/","POST",
               {"comments":[{"post_id":pid,"html":text}]},
               {"x-ghost-integrity-token":itok})
    cid=json.loads(b).get("comments",[{}])[0].get("id")
    print("  comment:",st,cid)
    time.sleep(1)
print("SEED_COMMENTS_DONE")
